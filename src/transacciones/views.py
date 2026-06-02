import logging
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings as django_settings
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.template.loader import render_to_string
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from .models import Transaction
from .serializers import TransactionSerializer
from accounts.models import Account
from accounts.serializers import AccountSerializer
from django_otp.plugins.otp_totp.models import TOTPDevice
from users.utils import verify_mfa_code, get_client_ip

audit_log = logging.getLogger('securabank.audit')


def _parse_monto(raw):
    try:
        value = Decimal(str(raw))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError({"error": "El monto debe ser un número válido."})
    if value <= 0:
        raise ValidationError({"error": "El monto debe ser mayor a cero."})
    return value


def _check_mfa_if_required(user, monto, mfa_code):
    if monto > 500:
        if not mfa_code:
            raise ValidationError({"error": "Se requiere código MFA para transferencias mayores a $500."})
        device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
        if not device or not device.verify_token(mfa_code):
            raise ValidationError({"error": "Código MFA inválido."})


def _send_transfer_notification(user, from_account, to_account, monto, moneda):
    if not user.email:
        return
    subject = f"SecuraBank — Transferencia de {monto} {moneda} realizada"
    message = render_to_string('transfer_confirmation_email.html', {
        'user': user,
        'from_account': from_account,
        'to_account': to_account,
        'monto': monto,
        'moneda': moneda,
        'nuevo_saldo': from_account.saldo,
        'fecha': timezone.now(),
    })
    send_mail(
        subject,
        message,
        django_settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
        html_message=message,
    )


@extend_schema(tags=['Transacciones'])
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-fecha')

    def perform_create(self, serializer):
        data = self.request.data
        from_account_id = data.get('from_account')
        to_account_id = data.get('to_account')
        monto = _parse_monto(data.get('monto'))
        mfa_code = data.get('mfa_code')
        ip = get_client_ip(self.request)

        from_account = get_object_or_404(Account, id=from_account_id, user=self.request.user)
        to_account = get_object_or_404(Account, id=to_account_id)

        if from_account.saldo < monto:
            audit_log.warning(
                f"TRANSFER_FAILED | user={self.request.user.username} "
                f"| from={from_account.account_number} | amount={monto} "
                f"| reason=insufficient_funds | ip={ip}"
            )
            raise ValidationError({"error": "Saldo insuficiente en la cuenta de origen."})

        _check_mfa_if_required(self.request.user, monto, mfa_code)

        with db_transaction.atomic():
            from_account.saldo -= monto
            to_account.saldo += monto
            from_account.save()
            to_account.save()
            serializer.save(
                user=self.request.user,
                from_account=from_account,
                to_account=to_account,
                monto=monto,
                moneda=data.get('moneda', 'USD'),
                estado='completada',
            )

        audit_log.info(
            f"TRANSFER | user={self.request.user.username} "
            f"| from={from_account.account_number} | to={to_account.account_number} "
            f"| amount={monto} | currency={data.get('moneda', 'USD')} | ip={ip}"
        )
        _send_transfer_notification(
            self.request.user, from_account, to_account, monto, data.get('moneda', 'USD')
        )


@extend_schema(tags=['Transacciones'])
class CreateTransaccionView(APIView):
    """Vista alternativa con verificación MFA inline."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from_account_id = request.data.get('from_account')
        to_account_id = request.data.get('to_account')
        mfa_code = request.data.get('mfa_code')
        ip = get_client_ip(request)

        if not from_account_id or not to_account_id or not request.data.get('monto'):
            return Response({"error": "Faltan datos para la transferencia."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            monto = _parse_monto(request.data.get('monto'))
        except ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_account = Account.objects.get(id=from_account_id, user=request.user)
        except Account.DoesNotExist:
            return Response({"error": "Cuenta de origen no existe o no te pertenece."}, status=status.HTTP_404_NOT_FOUND)

        try:
            to_account = Account.objects.get(id=to_account_id)
        except Account.DoesNotExist:
            return Response({"error": "Cuenta destino no existe."}, status=status.HTTP_404_NOT_FOUND)

        if from_account.saldo < monto:
            audit_log.warning(
                f"TRANSFER_FAILED | user={request.user.username} "
                f"| from={from_account.account_number} | amount={monto} "
                f"| reason=insufficient_funds | ip={ip}"
            )
            return Response({"error": "Fondos insuficientes en la cuenta origen."}, status=status.HTTP_400_BAD_REQUEST)

        if monto > 500:
            if not mfa_code:
                return Response({"detail": "Se requiere un código MFA para esta transacción."}, status=status.HTTP_400_BAD_REQUEST)
            if not verify_mfa_code(request.user, mfa_code):
                return Response({"detail": "Código MFA inválido."}, status=status.HTTP_400_BAD_REQUEST)

        with db_transaction.atomic():
            from_account.saldo -= monto
            to_account.saldo += monto
            from_account.save()
            to_account.save()
            transaccion = Transaction.objects.create(
                user=request.user,
                from_account=from_account,
                to_account=to_account,
                monto=monto,
                moneda=request.data.get('moneda', 'USD'),
                transa_ubicacion=request.data.get('location', ''),
                estado='completada',
            )

        audit_log.info(
            f"TRANSFER | user={request.user.username} "
            f"| from={from_account.account_number} | to={to_account.account_number} "
            f"| amount={monto} | ip={ip}"
        )
        _send_transfer_notification(request.user, from_account, to_account, monto, request.data.get('moneda', 'USD'))
        serializer = TransactionSerializer(transaccion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Dashboard'],
    responses={200: OpenApiResponse(description='Resumen de cuentas y transacciones del usuario')},
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """
    Retorna un resumen del estado financiero del usuario:
    saldo total, número de cuentas, transacciones, y actividad de los últimos 7 días.
    """
    user = request.user
    accounts = Account.objects.filter(user=user)
    total_saldo = accounts.aggregate(total=Sum('saldo'))['total'] or Decimal('0')
    total_transacciones = Transaction.objects.filter(user=user).count()

    hoy = date.today()
    hace_7_dias = hoy - timedelta(days=6)

    enviadas = (
        Transaction.objects.filter(user=user, fecha__date__gte=hace_7_dias)
        .annotate(dia=TruncDate('fecha'))
        .values('dia')
        .annotate(count=Count('id'))
    )
    enviadas_dict = {str(e['dia']): e['count'] for e in enviadas}

    recibidas = (
        Transaction.objects.filter(to_account__user=user, fecha__date__gte=hace_7_dias)
        .annotate(dia=TruncDate('fecha'))
        .values('dia')
        .annotate(count=Count('id'))
    )
    recibidas_dict = {str(r['dia']): r['count'] for r in recibidas}

    dias = []
    for i in range(7):
        dia = hoy - timedelta(days=6 - i)
        dia_str = str(dia)
        dias.append({
            'fecha': dia_str,
            'enviadas': enviadas_dict.get(dia_str, 0),
            'recibidas': recibidas_dict.get(dia_str, 0),
        })

    return Response({
        'resumen': {
            'total_saldo': float(total_saldo),
            'num_cuentas': accounts.count(),
            'num_transacciones': total_transacciones,
        },
        'transacciones_por_dia': dias,
        'cuentas': AccountSerializer(accounts, many=True).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_transfer_mfa(request):
    mfa_code = request.data.get('mfa_code')
    if not mfa_code:
        return Response({'detail': 'Se requiere un código MFA.'}, status=400)

    device = TOTPDevice.objects.filter(user=request.user, confirmed=True).first()
    if device and device.verify_token(mfa_code):
        return Response({'detail': 'Código MFA válido.'}, status=200)
    return Response({'detail': 'Código MFA inválido.'}, status=400)

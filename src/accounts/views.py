import uuid
import logging

from rest_framework import viewsets, permissions, generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from django.db import transaction as db_transaction

from .models import Account
from .serializers import AccountSerializer
from users.utils import get_client_ip

audit_log = logging.getLogger('securabank.audit')


def _generate_account_number():
    return f"ACC-{uuid.uuid4().hex[:10].upper()}"


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        account = serializer.save(
            user=self.request.user,
            account_number=_generate_account_number(),
        )
        audit_log.info(
            f"ACCOUNT_CREATED | user={self.request.user.username} "
            f"| account={account.account_number} | ip={get_client_ip(self.request)}"
        )

    def perform_destroy(self, instance):
        audit_log.info(
            f"ACCOUNT_DELETED | user={self.request.user.username} "
            f"| account={instance.account_number} | ip={get_client_ip(self.request)}"
        )
        instance.delete()


class UserAccountsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)


class AllAccountsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.all()


class AccountListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cuentas = Account.objects.filter(user=request.user)
        serializer = AccountSerializer(cuentas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CrearCuentaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            account = serializer.save(
                user=request.user,
                account_number=_generate_account_number(),
            )
            audit_log.info(
                f"ACCOUNT_CREATED | user={request.user.username} "
                f"| account={account.account_number} | ip={get_client_ip(request)}"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AccountLookupView(APIView):
    """Busca una cuenta por número. Solo devuelve datos mínimos para confirmar destino."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        number = request.query_params.get('number', '').strip().upper()
        if not number:
            return Response({'error': 'Proporcione un número de cuenta.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            account = Account.objects.get(account_number=number)
        except Account.DoesNotExist:
            return Response({'error': 'Cuenta no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id': account.id,
            'account_number': account.account_number,
            'owner': account.user.get_full_name() or account.user.username,
        })

# transacciones/views.py
from django.db import transaction as db_transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from django.db.models import Q
from rest_framework.permissions import IsAuthenticated

from .models import Transaction
from .serializers import TransactionSerializer
from users.models import Account  # Ajusta según tu proyecto
from django_otp.plugins.otp_totp.models import TOTPDevice  # Para MFA, si lo usas

class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD de transacciones
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Limita las transacciones al usuario autenticado.
        El usuario puede ver transacciones donde es ORIGEN o DESTINO.
        Si llega ?cuenta_id=XYZ, filtra además por esa cuenta.
        """
        user = self.request.user

        qs = Transaction.objects.filter(cuenta_origen__user=user) \
             | Transaction.objects.filter(cuenta_destino__user=user)
        qs = qs.distinct()

        cuenta_id = self.request.query_params.get('cuenta_id')
        if cuenta_id:
            qs = qs.filter(Q(cuenta_origen_id=cuenta_id) | Q(cuenta_destino_id=cuenta_id))

        return qs

    def create(self, request, *args, **kwargs):
        """
        Al crear una transacción:
        - Se valida que cuenta_origen sea del usuario autenticado.
        - Se crea inicialmente en estado 'proceso'.
        - *Opcional:* Se podría requerir MFA antes de descontar saldo (ver confirm_mfa).
          O bien, aquí mismo se descuenta el saldo si NO usamos un flujo de confirmación aparte.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cuenta_origen = serializer.validated_data['cuenta_origen']
        cuenta_destino = serializer.validated_data['cuenta_destino']
        monto = serializer.validated_data['monto']

        # Verificar propietario de la cuenta origen
        if cuenta_origen.user != request.user:
            return Response(
                {"error": "La cuenta de origen no pertenece al usuario actual."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Crear la transacción con estado 'proceso'
        transaccion_proceso = serializer.save(estado='proceso')

        try:
            with db_transaction.atomic():
                # Bloqueamos las cuentas para evitar problemas de concurrencia
                cta_origen = Account.objects.select_for_update().get(pk=cuenta_origen.id)
                cta_destino = Account.objects.select_for_update().get(pk=cuenta_destino.id)

                # Validar que no sea la misma cuenta
                if cta_origen.id == cta_destino.id:
                    transaccion_proceso.estado = 'fallida'
                    transaccion_proceso.save()
                    return Response(
                        {"detail": "La cuenta origen y destino no pueden ser la misma."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verificar saldo de nuevo
                if cta_origen.saldo < float(monto):
                    # Actualizamos la transacción a fallida
                    transaccion_proceso.estado = 'fallida'
                    transaccion_proceso.save()
                    return Response(
                        self.get_serializer(transaccion_proceso).data,
                        status=status.HTTP_200_OK
                    )

                # Descontar y acreditar saldo
                cta_origen.saldo -= float(monto)
                cta_origen.save()
                cta_destino.saldo += float(monto)
                cta_destino.save()

                # Marcar transacción como 'completada'
                transaccion_proceso.estado = 'completada'
                transaccion_proceso.save()

                return Response(
                    self.get_serializer(transaccion_proceso).data,
                    status=status.HTTP_201_CREATED
                )

        except Account.DoesNotExist:
            return Response(
                {"detail": "La cuenta de origen o destino no existe."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def confirm_mfa(self, request, pk=None):
        """
        Endpoint para confirmar una transacción en 'proceso' usando MFA.
        Si la transacción se confirma, se descuenta el saldo aquí.
        En este ejemplo ya estamos descontando saldo en create(),
        pero podrías mover la lógica de "descontar/acrecentar" aquí
        si quieres que ocurra solo tras MFA exitoso.
        """
        try:
            transaccion = self.get_object()

            if transaccion.estado != 'proceso':
                return Response(
                    {"detail": "Solo se pueden confirmar transacciones en proceso."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar que la cuenta de origen pertenezca al usuario
            if transaccion.cuenta_origen.user != request.user:
                return Response(
                    {"error": "No tienes permiso para confirmar esta transacción."},
                    status=status.HTTP_403_FORBIDDEN
                )

            mfa_code = request.data.get('mfa_code')
            if not mfa_code:
                return Response({"error": "Se requiere un código MFA."}, status=status.HTTP_400_BAD_REQUEST)

            devices = TOTPDevice.objects.filter(user=request.user, confirmed=True)
            if not devices.exists():
                return Response(
                    {"error": "No tienes dispositivos MFA configurados."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            is_valid = False
            for device in devices:
                if device.verify_token(mfa_code):
                    is_valid = True
                    break

            if is_valid:
                # Si estuvieras esperando este confirm para mover saldo, hazlo aquí.
                # Para este ejemplo, suponemos que ya se aplicó el saldo en create().
                # Podrías cambiar la lógica si lo necesitas.

                transaccion.estado = 'completada'
                transaccion.save()
                serializer = self.get_serializer(transaccion)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Código MFA inválido."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Account.DoesNotExist:
            return Response(
                {"detail": "Cuenta de origen o destino no existe."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def revertir(self, request, pk=None):
        """
        Endpoint para revertir una transacción COMPLETADA.
        Solo accesible para superusuarios (o el rol que definas).
        """
        try:
            transaccion = self.get_object()
            if transaccion.estado != 'completada':
                return Response(
                    {"detail": "Solo se pueden revertir transacciones completadas."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not request.user.is_superuser:
                return Response(
                    {"detail": "No tienes permiso para revertir transacciones."},
                    status=status.HTTP_403_FORBIDDEN
                )

            with db_transaction.atomic():
                cuenta_origen = Account.objects.select_for_update().get(pk=transaccion.cuenta_origen.pk)
                cuenta_destino = Account.objects.select_for_update().get(pk=transaccion.cuenta_destino.pk)
                monto = float(transaccion.monto)

                # Se "deshace" la transacción original
                cuenta_origen.saldo += monto
                cuenta_origen.save()
                cuenta_destino.saldo -= monto
                cuenta_destino.save()

                transaccion.estado = 'revertida'
                transaccion.save()

            serializer = self.get_serializer(transaccion)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Account.DoesNotExist:
            return Response(
                {"detail": "Cuenta no encontrada. Imposible revertir."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TransactionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vista para obtener el historial de transacciones de un usuario.
    Se pueden filtrar por tipo (deposito, retiro) y rango de fechas (fecha_inicio, fecha_fin).
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Transaction.objects.filter(
            Q(cuenta_origen__user=user) | Q(cuenta_destino__user=user)
        ).distinct()

        tipo = self.request.query_params.get('tipo')
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')

        # 'tipo' puede ser algo como 'deposito' o 'retiro' según la lógica que definas
        if tipo:
            if tipo.lower() == 'deposito':
                qs = qs.filter(cuenta_destino__user=user)
            elif tipo.lower() == 'retiro':
                qs = qs.filter(cuenta_origen__user=user)

        if fecha_inicio and fecha_fin:
            qs = qs.filter(created_at__range=[fecha_inicio, fecha_fin])

        return qs

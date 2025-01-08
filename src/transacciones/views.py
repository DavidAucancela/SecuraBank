from django.db import transaction as db_transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Transaction
from .serializers import TransactionSerializer
from users.models import Account  

from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes



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
        El usuario puede ver transacciones donde es origen o destino.
        """
        user = self.request.user
        return Transaction.objects.filter(
            cuenta_origen__user=user
        ) | Transaction.objects.filter(
            cuenta_destino__user=user
        ).distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cuenta_origen = serializer.validated_data['cuenta_origen']
        cuenta_destino = serializer.validated_data['cuenta_destino']
        monto = serializer.validated_data['monto']

        # Verificar que la cuenta de origen pertenece al usuario
        if cuenta_origen.user != request.user:
            return Response({"error": "La cuenta de origen no pertenece al usuario."}, status=status.HTTP_403_FORBIDDEN)

        # Crear la transacción con estado 'proceso'
        transaction = serializer.save(estado='proceso')

        # Validación para verificar que el monto es positivo
        if float(monto) <= 0:
            return Response(
                {"detail": "El monto debe ser mayor que cero."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with db_transaction.atomic():
                # Bloqueamos las cuentas para evitar concurrencia
                cuenta_origen = Account.objects.select_for_update().get(pk=cuenta_origen_id)
                cuenta_destino = Account.objects.select_for_update().get(pk=cuenta_destino_id)

                # Validación para asegurarse de que las cuentas no sean iguales
                if cuenta_origen_id == cuenta_destino_id:
                    return Response(
                        {"detail": "La cuenta origen y destino no pueden ser la misma."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 1) Validaciones
                if cuenta_origen_id == cuenta_destino_id:
                    return Response(
                        {"detail": "La cuenta origen y destino no pueden ser la misma."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if float(monto) <= 0:
                    return Response(
                        {"detail": "El monto debe ser mayor que cero."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 2) Verificar saldo
                if cuenta_origen.saldo < float(monto):
                    # Creamos la transacción fallida
                    transaccion = Transaction.objects.create(
                        cuenta_origen=cuenta_origen,
                        cuenta_destino=cuenta_destino,
                        monto=monto,
                        estado='fallida'
                    )
                    serializer = self.get_serializer(transaccion)
                    return Response(serializer.data, status=status.HTTP_200_OK)

                # 3) Descontar saldo de origen / sumar a destino
                cuenta_origen.saldo -= float(monto)
                cuenta_origen.save()

                cuenta_destino.saldo += float(monto)
                cuenta_destino.save()

                # 4) Crear transacción como 'completada'
                transaccion = Transaction.objects.create(
                    cuenta_origen=cuenta_origen,
                    cuenta_destino=cuenta_destino,
                    monto=monto,
                    estado='completada'
                )

                serializer = self.get_serializer(transaccion)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

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
        Endpoint para confirmar una transacción pendiente con MFA.
        Se espera { mfa_code } en el body.
        """
        try:
            transaccion = self.get_object()

            # Verificar que la transacción está en estado 'proceso'
            if transaccion.estado != 'proceso':
                return Response(
                    {"detail": "Solo se pueden confirmar transacciones en proceso."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar que la transacción pertenece al usuario
            if transaccion.cuenta_origen.user != request.user:
                return Response(
                    {"error": "No tienes permiso para confirmar esta transacción."},
                    status=status.HTTP_403_FORBIDDEN
                )

            mfa_code = request.data.get('mfa_code')

            if not mfa_code:
                return Response(
                    {"error": "Se requiere un código MFA."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Obtener los dispositivos TOTP confirmados del usuario
            devices = TOTPDevice.objects.filter(user=request.user, confirmed=True)
            if not devices.exists():
                return Response(
                    {"error": "No tienes dispositivos MFA configurados."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar el código MFA usando los dispositivos TOTP
            is_valid = False
            for device in devices:
                if device.verify_token(mfa_code):
                    is_valid = True
                    break

            if is_valid:
                with db_transaction.atomic():
                    # Bloquear las cuentas para evitar concurrencia
                    cuenta_origen = Account.objects.select_for_update().get(pk=transaccion.cuenta_origen.pk)
                    cuenta_destino = Account.objects.select_for_update().get(pk=transaccion.cuenta_destino.pk)

                    # Verificar nuevamente el saldo antes de procesar
                    if cuenta_origen.saldo < float(transaccion.monto):
                        transaccion.estado = 'fallida'
                        transaccion.save()
                        return Response(
                            {"detail": "Saldo insuficiente para completar la transacción."},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Procesar la transacción
                    cuenta_origen.saldo -= float(transaccion.monto)
                    cuenta_destino.saldo += float(transaccion.monto)
                    cuenta_origen.save()
                    cuenta_destino.save()

                    # Actualizar el estado de la transacción
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
            {"detail": "La cuenta de origen o destino no existe."},
            status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    # Vista para revertir transacciones completadas
    @action(detail=True, methods=['post'])  
    def revertir(self, request, pk=None):
        """
        Endpoint para revertir una transacción COMPLETADA.
        Solo accesible para superusuarios o según la lógica de la app.
        """
        try:
            transaccion = self.get_object()
            # Validar estado
            if transaccion.estado != 'completada':
                return Response(
                    {"detail": "Solo se pueden revertir transacciones completadas."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validar permisos (ejemplo simple)
            if not request.user.is_superuser:
                return Response(
                    {"detail": "No tienes permiso para revertir transacciones."},
                    status=status.HTTP_403_FORBIDDEN
                )

            with db_transaction.atomic():
                # Bloqueamos las cuentas involucradas
                cuenta_origen = Account.objects.select_for_update().get(pk=transaccion.cuenta_origen.pk)
                cuenta_destino = Account.objects.select_for_update().get(pk=transaccion.cuenta_destino.pk)

                # Revertir la operación
                monto = float(transaccion.monto)

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
    Se pueden filtrar por tipo (deposito, retiro) y rango de fechas.
    """
    serializer_class = TransactionSerializer

    def get_queryset(self):
        
        """
        # Solo mostramos las transacciones de las cuentas del usuario logueado
        queryset = Transaction.objects.filter(
            Q(cuenta_origen__user=self.request.user) | Q(cuenta_destino__user=self.request.user)
        )
        """
        
        # Filtrar por tipo de transacción (deposito, retiro)
        transaction_type = self.request.query_params.get('transaction_type', None)
        if transaction_type:
            queryset = queryset.filter(estado=transaction_type)

        # Filtrar por rango de fechas (start_date y end_date)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if start_date and end_date:
            queryset = queryset.filter(fecha__range=[start_date, end_date])

        return queryset
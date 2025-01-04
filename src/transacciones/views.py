# transacciones/views.py
from django.db import transaction as db_transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Transaction
from .serializers import TransactionSerializer
from users.models import Account  # Ajusta la importación a tu proyecto

class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD de transacciones
    - list, retrieve, create, update, destroy
    """
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def create(self, request, *args, **kwargs):
        """
        Sobrescribimos create para:
         - Validar saldo
         - Ajustar saldos de origen y destino
         - Manejar estados
        """
        data = request.data
        cuenta_origen_id = data.get('cuenta_origen')
        cuenta_destino_id = data.get('cuenta_destino')
        monto = data.get('monto')

        try:
            with db_transaction.atomic():
                # Bloqueamos las cuentas para evitar concurrencia
                cuenta_origen = Account.objects.select_for_update().get(pk=cuenta_origen_id)
                cuenta_destino = Account.objects.select_for_update().get(pk=cuenta_destino_id)

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

    @action(detail=True, methods=['post'])
    def revertir(self, request, pk=None):
        """
        Endpoint para revertir una transacción COMPLETADA.
        Solo accesible para superusuarios o según la lógica de tu app.
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

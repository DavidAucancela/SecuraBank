from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Transaccion
from .serializers import TransaccionSerializer
from django.contrib.auth.models import User
from accounts.models import Account

# MFA
from django_otp.models import Device
from users.utils import verify_mfa_code  

# si el monto es +500
class RealizarTransferenciaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Realiza una transferencia entre cuentas. Si el monto supera los 500, se requiere MFA.
        """
        usuario = request.user
        monto = request.data.get('monto')
        cuenta_origen = request.data.get('cuenta_origen')
        cuenta_destino = request.data.get('cuenta_destino')

        # Validaciones básicas de datos
        if not monto or not cuenta_origen or not cuenta_destino:
            return Response({'detail': 'Faltan datos para la transferencia.'}, status=status.HTTP_400_BAD_REQUEST)

        monto = float(monto)

        # Verificar que la cuenta de destino existe
        try:
            cuenta_destino_usuario = User.objects.get(id=cuenta_destino)
        except User.DoesNotExist:
            return Response({'detail': 'Cuenta de destino no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        # Verificar si el monto supera 500, en cuyo caso se requiere MFA
        if monto > 500:
            device = Device.objects.filter(user=usuario, confirmed=True).first()
            if not device:
                return Response({'detail': 'No tienes un dispositivo MFA confirmado.'}, status=status.HTTP_403_FORBIDDEN)

            # Verificar el código MFA
            mfa_code = request.data.get('mfa_code')
            if not mfa_code:
                return Response({'detail': 'Se requiere un código MFA para esta transacción.'}, status=status.HTTP_400_BAD_REQUEST)

            if not device.verify_token(mfa_code):
                return Response({'detail': 'Código MFA inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # Crear la transacción
        transaccion = Transaccion.objects.create(
            id_usuario=usuario,
            monto=monto,
            moneda=request.data.get('moneda', 'USD'),
            ubicacion=request.data.get('ubicacion'),
            estado='completada'
        )

        return Response({'detail': 'Transferencia realizada exitosamente.', 'transaccion_id': transaccion.id}, status=status.HTTP_200_OK)

class CreateTransaccionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from_account_id = request.data.get('from_account')
        to_account_id = request.data.get('to_account')
        amount = request.data.get('amount')
        currency = request.data.get('currency')

        if not from_account_id or not to_account_id or not amount:
            return Response({"error": "Faltan datos para la transferencia."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_account = Account.objects.get(id=from_account_id, user=request.user)
        except Account.DoesNotExist:
            return Response({"error": "Cuenta de origen no existe o no pertenece al usuario."}, status=status.HTTP_404_NOT_FOUND)

        try:
            to_account = Account.objects.get(id=to_account_id)
        except Account.DoesNotExist:
            return Response({"error": "Cuenta destino no existe."}, status=status.HTTP_404_NOT_FOUND)

        try:
            amount = float(amount)
        except ValueError:
            return Response({"error": "El monto debe ser un número válido."}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si el monto supera 500, en cuyo caso se requiere MFA
        if amount > 500:
            # Obtener el código MFA enviado por el usuario
            mfa_code = request.data.get('mfa_code')
            if not mfa_code:
                return Response({'detail': 'Se requiere un código MFA para esta transacción.'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar el código MFA usando el método de la app users
            if not verify_mfa_code(request.user, mfa_code):
                return Response({'detail': 'Código MFA inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        # (Opcional) Verificar si la cuenta origen tiene saldo suficiente
        if from_account.balance < amount:
            return Response({'error': 'Fondos insuficientes en la cuenta origen.'}, status=status.HTTP_400_BAD_REQUEST)

        # Crear la transacción
        transaccion = Transaccion.objects.create(
            id_usuario=request.user,
            from_account=from_account,
            to_account=to_account,
            monto=amount,
            moneda=currency,
            ubicacion=request.data.get('location', ''),
            estado='completada'  # Ajusta esto según la lógica de tu negocio
        )

        # (Opcional) Actualizar los saldos de las cuentas
        from_account.balance -= amount
        to_account.balance += amount
        from_account.save()
        to_account.save()

        serializer = TransaccionSerializer(transaccion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
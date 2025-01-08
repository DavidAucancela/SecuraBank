from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction

from .models import Account
from .serializers import AccountSerializer

class AccountViewSet(viewsets.ModelViewSet):
    """
    CRUD de cuentas
    """
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        cada usuario vea solo sus cuentas
        devolver las cuentas del usuario logueado
        """
        return Account.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Asignar automáticamente el 'user' a la cuenta.
        """
        data = request.data.copy()
        data['user'] = request.user.id  # Forzamos la cuenta al usuario logueado
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # Bloque transaccional (por si se requiere consistencia extra, aunque aquí es sencillo)
        with db_transaction.atomic():
            self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
   
    def perform_create(self, serializer):
        # Generar un número de cuenta único, puedes usar UUID o cualquier lógica preferida
        import uuid
        account_number = str(uuid.uuid4()).replace('-', '')[:12].upper()
        serializer.save(user=self.request.user, account_number=account_number)
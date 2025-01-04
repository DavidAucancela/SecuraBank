from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction

from .models import Account
from .serializers import AccountSerializer

class AccountViewSet(viewsets.ModelViewSet):
    """
    Vista CRUD para las cuentas.
    - list, retrieve, create, update, destroy
    """
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Sobre-escribimos para que cada usuario vea solo sus cuentas
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

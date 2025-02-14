# Django REST Framework (DRF) - Vistas, Permisos y Respuestas
from rest_framework import viewsets, permissions, generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

# Base de Datos
from django.db import transaction as db_transaction

# Modelos y Serialización
from .models import Account
from .serializers import AccountSerializer

# Vistas para las cuentas 
class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]  # Solo usuarios autenticados

    def get_queryset(self):
        # Cada usuario solo ve sus cuentas
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Asignar automáticamente el usuario a la cuenta
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # Asignar automáticamente el usuario y el número de cuenta
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Eliminar una cuenta específica
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserAccountsView(generics.ListAPIView):
    """
    Devuelve las cuentas asociadas al usuario autenticado.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

class AllAccountsView(generics.ListAPIView):
    """
    Devuelve todas las cuentas registradas en el sistema.
    Si se desea excluir las cuentas del usuario actual, se puede modificar el queryset.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AccountSerializer

    def get_queryset(self):
        # Para incluir todas las cuentas:
        return Account.objects.all()
        # Para excluir las cuentas del usuario actual:
        # return Account.objects.exclude(user=self.request.user)

class AccountListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Lista todas las cuentas que pertenecen al usuario autenticado.
        """
        cuentas = Account.objects.filter(user=request.user)
        serializer = AccountSerializer(cuentas, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CrearCuentaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Crea una nueva cuenta y la asigna al usuario autenticado.
        """
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)  # Asigna la cuenta al usuario autenticado
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
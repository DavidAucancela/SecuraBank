
from django.urls import path, include
from rest_framework import routers
from .views import TransactionViewSet, TransactionHistoryViewSet

router = routers.DefaultRouter()
# Registrar para que sea /api/transacciones/ para la lista y /api/transacciones/{pk}/ para detalles
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'transactions-history', TransactionHistoryViewSet, basename='transactions-history')

urlpatterns = [
    path('', include(router.urls)),
]
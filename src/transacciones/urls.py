from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CreateTransaccionView, verify_transfer_mfa, dashboard

router = DefaultRouter()
router.register(r'', TransactionViewSet, basename='transacciones')

urlpatterns = [
    path('dashboard/', dashboard, name='dashboard'),
    path('crear/', CreateTransaccionView.as_view(), name='create_transferencia'),
    path('verify-transfer-mfa', verify_transfer_mfa, name='verify_transfer_mfa'),
    path('', include(router.urls)),
]

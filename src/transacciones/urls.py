from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, TransactionHistoryViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'transactions-history', TransactionHistoryViewSet, basename='transactions-history')

urlpatterns = router.urls

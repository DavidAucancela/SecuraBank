from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter


router = DefaultRouter()

urlpatterns = [
    path('realizar_transferencia/', views.RealizarTransferenciaView, name='realizar_transferencia'),
    path('create/', views.CreateTransaccionView.as_view(), name='create_transaccion'),
]

urlpatterns = router.urls
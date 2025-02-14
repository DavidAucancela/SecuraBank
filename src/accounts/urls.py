from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, UserAccountsView, AllAccountsView, AccountListView, CrearCuentaView
from django.urls import path, include

router = DefaultRouter()
# Registrar sin sub-ruta, para que sea /api/accounts/ para la lista y /api/accounts/{pk}/ para detalles
router.register(r'accounts', AccountViewSet, basename='account')

urlpatterns = [
    # Rutas específicas
    path('user-accounts/', UserAccountsView.as_view(), name='user_accounts'),
    path('all-accounts/', AllAccountsView.as_view(), name='all_accounts'),
    path('crear/', CrearCuentaView.as_view(), name='crear_cuenta'),
    
    # Ruta de listado general de cuentas (utiliza la ruta del router)
    path('', AccountListView.as_view(), name='listar_cuentas'),
    
    # Incluimos las rutas del router para las acciones CRUD en /accounts/
    path('', include(router.urls)),  # Registrar las rutas del router
]

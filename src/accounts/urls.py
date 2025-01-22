from rest_framework.routers import DefaultRouter
from .views import AccountViewSet

router = DefaultRouter()
# Registrar sin sub-ruta, para que sea /api/cuentas/ para la lista y /api/cuentas/{pk}/ para detalles
router.register(r'', AccountViewSet, basename='accounts')

urlpatterns = router.urls
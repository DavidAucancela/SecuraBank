from rest_framework.routers import DefaultRouter
from .views import AccountViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='accounts')

#router para registrar las vistas
urlpatterns = router.urls

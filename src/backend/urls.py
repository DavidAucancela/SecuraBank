from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Rutas tokens
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Rutas de la API
    path('api/users/', include('users.urls')),  
    path('api/accounts/', include('accounts.urls')),
    path('api/transacciones/', include('transacciones.urls')),
    
]
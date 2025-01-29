from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Rutas de la API
    path('api/users/', include('users.urls')),  
    path('api/accounts/', include('accounts.urls')),
    path('api/transacciones/', include('transacciones.urls')),
]

#pendiente, se esta trabajando con 
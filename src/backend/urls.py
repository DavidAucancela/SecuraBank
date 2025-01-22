from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Rutas de la API
    #path('api/login/', include('auth_app.urls')), 
    path('api/users/', include('users.urls')),  
    path('api/transacciones/', include('transacciones.urls')),
    path('api/cuentas/', include('accounts.urls')),
    
]

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Rutas de la API
    #path('api/login/', include('auth_app.urls')), 
    path('api/users/', include('users.urls')),  
    path('api/transactions/', include('transactions.urls')),
    path('api/accounts/', include('accounts.urls')),
    
]

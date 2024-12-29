from django.urls import path
from . import views  #vistas

urlpatterns = [
    path('', views.home, name='transacciones_home'),  
]

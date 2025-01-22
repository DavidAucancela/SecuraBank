from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Account(models.Model):
    # estados de la cuenta
    STATUS_CHOICES  = (
        ('activa', 'Activa'),
        ('inactiva', 'Inactiva'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts') #relacion uno a muchos con usuario 
    name = models.CharField(max_length=100, default='Cuenta Principal')  

    account_number = models.CharField(max_length=30, unique=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='activa')
    saldo = models.DecimalField(max_digits=10, decimal_places=2, default=125.00) #saldo inicial
    created_at = models.DateTimeField(default=timezone.now)


    def __str__(self):
        #revisar si se debe enviar username o name en el return
        return f"{self.user.username} - {self.account_number}"

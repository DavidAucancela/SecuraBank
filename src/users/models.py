from django.contrib.auth.models import User
from django.db import models
from django_otp.models import Device

class TOTPDevice(Device):
    """
    Dispositivo TOTP para MFA (integrado con django-otp).
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='totp_devices'
    )

    name = models.CharField(max_length=100)
    confirmed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.name}"

class Account(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  
    numero_cuenta = models.CharField(max_length=50, unique=True)
    saldo = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - {self.numero_cuenta}"
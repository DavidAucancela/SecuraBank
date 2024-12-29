from django.contrib.auth.models import User
from django.db import models
from django_otp.models import Device

class TOTPDevice(Device):
    """Dispositivo TOTP para MFA"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='totp_devices')
    name = models.CharField(max_length=100)
    confirmed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.name}"

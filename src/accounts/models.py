from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='accounts')
    account_number = models.CharField(max_length=30, unique=True)
    saldo = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    created_at = models.DateTimeField(auto_now_add=True)  


    def __str__(self):
        return f"{self.user.username} - {self.account_number}"

from django.db import models
from django.utils import timezone
from accounts.models import Account

ESTADO_CHOICES = (
    ('proceso', 'En proceso'),
    ('completada', 'Completada'),
    ('fallida', 'Fallida'),
    ('revertida', 'Revertida'),
)

class Transaction(models.Model):
    cuenta_origen = models.ForeignKey(Account, related_name='transactions_origin', on_delete=models.CASCADE)
    cuenta_destino = models.ForeignKey(Account, related_name='transactions_destino', on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='proceso')

    def __str__(self):
        return f"Tx #{self.id} | {self.cuenta_origen} -> {self.cuenta_destino} | {self.monto}"

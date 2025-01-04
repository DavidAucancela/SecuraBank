# transacciones/models.py
from django.db import models
from django.utils import timezone

ESTADO_CHOICES = (
    ('proceso', 'En proceso'),
    ('completada', 'Completada'),
    ('fallida', 'Fallida'),
    ('revertida', 'Revertida'),
)

class Transaction(models.Model):
    # Si tienes un modelo Account, importalo: from users.models import Account (o donde se ubique)
    cuenta_origen = models.ForeignKey('users.Account', on_delete=models.CASCADE, related_name='transacciones_salida')
    cuenta_destino = models.ForeignKey('users.Account', on_delete=models.CASCADE, related_name='transacciones_entrada')
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='proceso')

    def __str__(self):
        return f"Tx #{self.id} | {self.cuenta_origen} -> {self.cuenta_destino} | {self.monto}"

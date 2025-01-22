# transacciones/models.py
from django.db import models
from django.utils import timezone
from users.models import Account  # Ajusta según tu proyecto (App "users" o "accounts")

STATUS_CHOICES = (
    ('proceso', 'En proceso'),
    ('completada', 'Completada'),
    ('fallida', 'Fallida'),
    ('revertida', 'Revertida'),
)

class Transaction(models.Model):
    """
    Modelo que representa una transacción entre dos cuentas.
    """
    cuenta_origen = models.ForeignKey(
        Account,
        related_name='transactions_origin',
        on_delete=models.CASCADE
    )
    cuenta_destino = models.ForeignKey(
        Account,
        related_name='transactions_destino',
        on_delete=models.CASCADE
    )
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(default=timezone.now)
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='proceso')

    def __str__(self):
        return (
            f"Transacción de {self.cuenta_origen} a {self.cuenta_destino} "
            f"por {self.monto}, estado: {self.estado}"
        )

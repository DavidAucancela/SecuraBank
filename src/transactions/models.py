from django.db import models
from django.utils import timezone
from users.models import Account  # Importamos el modelo Account del módulo users

# definir aca para poder utilizarlo en el modelo Transaction
STATUS_CHOICES = (
    ('proceso', 'En proceso'),
    ('completada', 'Completada'),
    ('fallida', 'Fallida'),
    ('revertida', 'Revertida'),
)

class Transaction(models.Model):
    # Relacionamos la transacción con las cuentas de origen y destino
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
            # Mostramos la información de la transacción en el admin de Django
            f"Transacción de {self.cuenta_origen} a {self.cuenta_destino} "
            f"por {self.monto}, estado: {self.estado}"
        )

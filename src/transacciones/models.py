from django.db import models
from django.contrib.auth.models import User

class Transaccion(models.Model):
    ESTADO_CHOICES = [
        ('enviada', 'Enviada'),
        ('pendiente', 'Pendiente'),
        ('cancelada', 'Cancelada'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # Usuario 
    descripcion = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    moneda = models.CharField(
        max_length=10,
        choices=[('USD', 'Dólar'), ('EUR', 'Euro'), ('PESO', 'Peso')],
        default='USD',  # Valor predeterminado
    )
    fecha = models.DateTimeField(auto_now_add=True)
    ubicacion = models.CharField(max_length=255, default="Aquí nomas")  # Guardaremos la ubicación como texto
    estado = models.CharField(max_length=10, choices=ESTADO_CHOICES, default='pendiente')  # Estado predeterminado: pendiente

    def __str__(self):
        return f"{self.descripcion} - {self.usuario}"

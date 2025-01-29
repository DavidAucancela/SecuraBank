from rest_framework import serializers
from .models import Transaccion, CURRENCY_CHOICES

class TransaccionSerializer(serializers.ModelSerializer):
    moneda = serializers.ChoiceField(choices=CURRENCY_CHOICES, default='USD')
    class Meta:
        model = Transaccion
        fields = [
            'id',
            'user',
            'from_account',
            'to_account',
            'monto',
            'moneda',
            'fecha',
            'transa_ubicacion',
            'estado'
        ]
        read_only_fields = ['id', 'fecha', 'estado']

# transacciones/serializers.py
from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

    def validate(self, attrs):
        origen = attrs.get('cuenta_origen')
        destino = attrs.get('cuenta_destino')
        monto = attrs.get('monto')

        if origen == destino:
            raise serializers.ValidationError("La cuenta de origen y destino deben ser diferentes.")

        if monto is not None and monto <= 0:
            raise serializers.ValidationError("El monto debe ser mayor que cero.")

        # Validar saldo en cuenta origen
        if origen.saldo < monto:
            raise serializers.ValidationError("Saldo insuficiente en la cuenta de origen.")

        return attrs

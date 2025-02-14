from rest_framework import serializers
from .models import Account

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'account_number', 'saldo', 'created_at', 'name', 'estado', 'owner']
        read_only_fields = ['id', 'account_number', 'saldo', 'created_at']

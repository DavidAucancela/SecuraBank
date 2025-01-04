from rest_framework import serializers
from .models import Account

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'user', 'account_number', 'saldo']
        read_only_fields = ['user', 'saldo']  # El 'user' lo setea el backend

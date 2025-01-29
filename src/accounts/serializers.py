from rest_framework import serializers
from .models import Account

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
  
        fields = '__all__'
        #fields = ['id', 'account_number', 'saldo', 'created_at']
        # para que sirve read_only_fields?
        # read_only_fields es un atributo de la clase Meta que permite definir los campos que no se pueden modificar en la instancia del modelo.
        # read_only_fields = ['id', 'saldo', 'created_at']
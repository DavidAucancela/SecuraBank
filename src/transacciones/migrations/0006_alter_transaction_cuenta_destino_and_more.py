# Generated by Django 5.1.4 on 2025-01-21 16:21

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transacciones', '0005_remove_transaction_fecha_transaction_created_at_and_more'),
        ('users', '0004_passwordresettoken'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='cuenta_destino',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions_destino', to='users.account'),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='cuenta_origen',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions_origin', to='users.account'),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='estado',
            field=models.CharField(choices=[('proceso', 'En proceso'), ('completada', 'Completada'), ('fallida', 'Fallida'), ('revertida', 'Revertida')], default='proceso', max_length=10),
        ),
    ]

# Generated by Django 5.1.4 on 2025-01-21 02:53

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transacciones', '0004_alter_transaction_cuenta_destino_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='transaction',
            name='fecha',
        ),
        migrations.AddField(
            model_name='transaction',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='estado',
            field=models.CharField(choices=[('proceso', 'En proceso'), ('completada', 'Completada'), ('fallida', 'Fallida')], default='proceso', max_length=10),
        ),
    ]
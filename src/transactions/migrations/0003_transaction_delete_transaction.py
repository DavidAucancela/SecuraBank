# Generated by Django 5.1.4 on 2025-01-04 01:39

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0002_transaction_estado_transaction_moneda_and_more'),
        ('users', '0002_account'),
    ]

    operations = [
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('monto', models.DecimalField(decimal_places=2, max_digits=10)),
                ('fecha', models.DateTimeField(default=django.utils.timezone.now)),
                ('estado', models.CharField(choices=[('proceso', 'En proceso'), ('completada', 'Completada'), ('fallida', 'Fallida'), ('revertida', 'Revertida')], default='proceso', max_length=10)),
                ('cuenta_destino', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions_entrada', to='users.account')),
                ('cuenta_origen', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions_salida', to='users.account')),
            ],
        ),
        migrations.DeleteModel(
            name='transaction',
        ),
    ]

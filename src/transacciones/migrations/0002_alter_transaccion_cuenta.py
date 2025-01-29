# Generated by Django 5.1.4 on 2025-01-28 16:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_rename_status_account_estado'),
        ('transacciones', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaccion',
            name='cuenta',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transacciones', to='accounts.account'),
        ),
    ]

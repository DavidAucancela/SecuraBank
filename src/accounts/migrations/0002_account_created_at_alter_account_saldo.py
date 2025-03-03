# Generated by Django 5.1.4 on 2025-01-08 14:15

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='account',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=datetime.datetime(2025, 1, 8, 0, 0)),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='account',
            name='saldo',
            field=models.DecimalField(decimal_places=2, default=50.0, max_digits=10),
        ),
    ]

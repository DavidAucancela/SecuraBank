# Generated by Django 5.1.4 on 2025-01-31 15:29

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_passwordresettoken'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Account',
        ),
    ]

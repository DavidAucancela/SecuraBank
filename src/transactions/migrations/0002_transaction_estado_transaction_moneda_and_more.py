import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='estado',
            field=models.CharField(choices=[('enviada', 'Enviada'), ('pendiente', 'Pendiente'), ('cancelada', 'Cancelada')], default='pendiente', max_length=10),
        ),
        migrations.AddField(
            model_name='transaction',
            name='moneda',
            field=models.CharField(choices=[('USD', 'Dólar'), ('EUR', 'Euro'), ('PESO', 'Peso')], default='USD', max_length=10),
        ),
        migrations.AddField(
            model_name='transaction',
            name='ubicacion',
            field=models.CharField(default='Aquí nomas', max_length=255),
        ),
        migrations.AddField(
            model_name='transaction',
            name='usuario',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='transaction',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]

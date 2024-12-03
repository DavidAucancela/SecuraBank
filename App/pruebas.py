from usuarios.models import Usuario
nuevo_usuario = Usuario(nombre='David Aucancela', correo='david@example.com')
nuevo_usuario.save()
print(Usuario.objects.all())

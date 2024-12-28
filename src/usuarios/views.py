from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

class RegisterView(APIView):
    def post(self, request):
        data = request.data
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password']
            )
            token = Token.objects.create(user=user)
            return Response({'token': token.key, 'message': 'Usuario registrado con éxito'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'message': 'Inicio de sesión exitoso'})
        return Response({'error': 'Credenciales inválidas'}, status=400)

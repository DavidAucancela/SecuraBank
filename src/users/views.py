from rest_framework import generics, status
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    TOTPDeviceSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework.decorators import api_view, permission_classes
import qrcode
import qrcode.image.svg
from io import BytesIO
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_mfa_qr(request):
    user = request.user
    device, created = TOTPDevice.objects.get_or_create(user=user, name='default')
    if not device.confirmed:
        qr_url = device.config_url
        img = qrcode.make(qr_url, image_factory=qrcode.image.svg.SvgImage)
        buffer = BytesIO()
        img.save(buffer)
        svg = buffer.getvalue().decode()
        return Response({'qr_code': svg, 'secret': device.bin_key})
    return Response({'detail': 'MFA ya está configurado.'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_mfa(request):
    user = request.user
    token = request.data.get('token')
    device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
    if device and device.verify_token(token):
        device.confirmed = True
        device.save()
        return Response({'detail': 'MFA configurado correctamente.'})
    return Response({'detail': 'Token inválido.'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mfa_status(request):
    user = request.user
    has_confirmed_mfa = TOTPDevice.objects.filter(user=user, confirmed=True).exists()
    return Response({'mfa_required': has_confirmed_mfa}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Sesión cerrada exitosamente."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": "Error al cerrar sesión."}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"http://localhost:3000/reset-password/?uid={uid}&token={token}"  # Cambia según tu frontend

        # Enviar correo electrónico
        subject = "Restablece tu contraseña"
        message = render_to_string('password_reset_email.html', {
            'user': user,
            'reset_url': reset_url,
        })
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)

        return Response({"detail": "Se ha enviado un correo para restablecer la contraseña."}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Contraseña restablecida correctamente."}, status=status.HTTP_200_OK)

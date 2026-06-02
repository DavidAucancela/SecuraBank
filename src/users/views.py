import logging
from io import BytesIO
from datetime import timedelta
import qrcode
import qrcode.image.svg

from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils import timezone

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from django_otp.plugins.otp_totp.models import TOTPDevice

from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    TOTPDeviceSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserSerializer
)
from .models import LoginAttempt
from .utils import get_client_ip

audit_log = logging.getLogger('securabank.audit')

# ========== MFA (TOTP) ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_mfa_qr(request):
    """
    Genera el código QR para configurar TOTP (Google Authenticator, Authy, etc.).
    """
    user = request.user
    device, created = TOTPDevice.objects.get_or_create(user=user, name='default')

    if not device.confirmed:
        qr_url = device.config_url
        img = qrcode.make(qr_url, image_factory=qrcode.image.svg.SvgImage)
        buffer = BytesIO()
        img.save(buffer)
        svg = buffer.getvalue().decode()
        return Response({'qr_code': svg, 'secret': device.bin_key})
    return Response({'detail': 'MFA ya está configurado.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def confirm_mfa(request):
    """
    Verifica el código TOTP. No requiere autenticación previa (MFA pendiente).
    Bloquea tras 3 intentos fallidos en 5 minutos.
    """
    username = request.data.get('username')
    totp_code = request.data.get('token')
    ip = get_client_ip(request)

    if not username or not totp_code:
        return Response({'detail': 'Faltan campos.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_400_BAD_REQUEST)

    block_duration = timedelta(minutes=5)
    failed_mfa_attempts = LoginAttempt.objects.filter(
        user=user,
        timestamp__gte=timezone.now() - block_duration,
        successful=False,
        is_mfa_attempt=True
    ).count()

    if failed_mfa_attempts >= 3:
        audit_log.warning(f"MFA_BLOCKED | user={username} | ip={ip}")
        return Response(
            {"detail": "Demasiados intentos fallidos de MFA. Inténtalo de nuevo más tarde."},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
    if device and device.verify_token(totp_code):
        refresh = RefreshToken.for_user(user)
        LoginAttempt.objects.create(user=user, successful=True, is_mfa_attempt=True)
        audit_log.info(f"MFA_SUCCESS | user={username} | ip={ip}")
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'detail': 'MFA verificado',
        }, status=status.HTTP_200_OK)
    else:
        LoginAttempt.objects.create(user=user, successful=False, is_mfa_attempt=True)
        audit_log.warning(f"MFA_FAILED | user={username} | ip={ip}")
        return Response({'detail': 'Token MFA inválido.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mfa_status(request):
    user = request.user
    device = TOTPDevice.objects.filter(user=user, confirmed=True).first()

    if device:
        return Response({
            'mfa_enabled': True,
            'device_name': device.name,
            'confirmed': device.confirmed,
        })
    return Response({'mfa_enabled': False}, status=status.HTTP_404_NOT_FOUND)


# ========== OBTENER DATOS DEL USUARIO ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ========== REGISTRO ==========

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


# ========== LOGIN (JWT) ==========

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login con JWT. Bloquea tras 3 intentos fallidos en 5 minutos.
    Si el usuario tiene MFA confirmado, responde con mfa_required=True sin emitir tokens.
    """
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        ip = get_client_ip(request)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = None

        if user:
            block_duration = timedelta(minutes=5)
            failed_attempts = LoginAttempt.objects.filter(
                user=user,
                timestamp__gte=timezone.now() - block_duration,
                successful=False,
                is_mfa_attempt=False
            ).count()

            if failed_attempts >= 3:
                audit_log.warning(f"LOGIN_BLOCKED | user={username} | ip={ip}")
                return Response(
                    {"detail": "Demasiados intentos fallidos. Inténtalo de nuevo más tarde."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            if user:
                LoginAttempt.objects.create(user=user, successful=False, is_mfa_attempt=False)
            audit_log.warning(f"LOGIN_FAILED | user={username} | ip={ip}")
            return Response({"detail": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        LoginAttempt.objects.create(user=user, successful=True, is_mfa_attempt=False)

        has_mfa = TOTPDevice.objects.filter(user=user, confirmed=True).exists()
        if has_mfa:
            audit_log.info(f"LOGIN_MFA_REQUIRED | user={username} | ip={ip}")
            return Response({"mfa_required": True, "detail": "Se requiere MFA"}, status=status.HTTP_200_OK)

        audit_log.info(f"LOGIN_SUCCESS | user={username} | ip={ip}")
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


# ========== LOGOUT ==========

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            token = RefreshToken(request.data["refresh"])
            token.blacklist()
            audit_log.info(
                f"LOGOUT | user={request.user.username} | ip={get_client_ip(request)}"
            )
            return Response({"detail": "Sesión cerrada exitosamente."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Error al cerrar sesión."}, status=status.HTTP_400_BAD_REQUEST)


# ========== RECUPERACIÓN DE CONTRASEÑA ==========

class PasswordResetRequestView(generics.GenericAPIView):
    """
    Solicita el reseteo de contraseña. Limitado a 3 intentos por usuario en 5 minutos.
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        ip = get_client_ip(request)

        block_duration = timedelta(minutes=5)
        recent_attempts = LoginAttempt.objects.filter(
            user=user,
            timestamp__gte=timezone.now() - block_duration,
            is_mfa_attempt=False
        ).count()
        if recent_attempts >= 3:
            audit_log.warning(f"PASSWORD_RESET_BLOCKED | user={user.username} | ip={ip}")
            return Response(
                {"detail": "Demasiadas solicitudes. Inténtalo de nuevo más tarde."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{settings.FRONTEND_URL}/reset-password/?uid={uid}&token={token}"

        subject = "Restablece tu contraseña"
        message = render_to_string('password_reset_email.html', {
            'user': user,
            'reset_url': reset_url,
        })
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)

        audit_log.info(f"PASSWORD_RESET_REQUEST | user={user.username} | ip={ip}")
        return Response(
            {"detail": "Se ha enviado un correo para restablecer la contraseña."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        audit_log.info(
            f"PASSWORD_RESET_CONFIRM | user={user.username} | ip={get_client_ip(request)}"
        )
        return Response({"detail": "Contraseña restablecida correctamente."}, status=status.HTTP_200_OK)


# ========== USUARIOS ==========

class UserRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    Obtiene o actualiza un usuario por ID. Solo permite acceder al propio usuario.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if obj.pk != self.request.user.pk:
            raise PermissionDenied("No tienes permiso para acceder a este usuario.")
        return obj

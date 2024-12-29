from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django_otp.plugins.otp_totp.models import TOTPDevice

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)  # Confirmación de contraseña

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {'first_name': {'required': True}, 'last_name': {'required': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer personalizado para incluir datos adicionales en el token"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Añadir campos personalizados
        token['username'] = user.username
        token['email'] = user.email

        return token

class TOTPDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TOTPDevice
        fields = ['id', 'user', 'name', 'confirmed']
        read_only_fields = ['id', 'user', 'confirmed']

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No existe un usuario con este correo electrónico.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        return attrs

    def validate_token(self, value):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode
        try:
            uid = self.initial_data.get('uid')
            uid = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Token inválido.")

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, value):
            raise serializers.ValidationError("Token inválido o expirado.")
        return value

    def save(self):
        from django.contrib.auth.models import User
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        password = self.validated_data['new_password']
        uid = self.validated_data.get('uid')
        uid = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid)
        user.set_password(password)
        user.save()
        return user

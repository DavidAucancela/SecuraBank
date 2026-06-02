from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    UserDetailView,
    generate_mfa_qr,
    confirm_mfa,
    mfa_status,
    get_user,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

urlpatterns = [
    # Registro
    path('register/', RegisterView.as_view(), name='auth_register'),

    # Login (JWT)
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),

    # Refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # MFA
    path('mfa/generate/', generate_mfa_qr, name='mfa_generate'),
    path('mfa/confirm/', confirm_mfa, name='mfa_confirm'),
    path('mfa/status/', mfa_status, name='mfa_status'),

    # Logout
    path('logout/', LogoutView.as_view(), name='auth_logout'),

    # Recuperación de contraseña
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Información del usuario autenticado
    path('get-user/', get_user, name='get_user'),

    # Detalle/edición del usuario por ID (solo propio usuario)
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]

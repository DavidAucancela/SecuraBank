from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    generate_mfa_qr,
    confirm_mfa,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    mfa_status
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('mfa/generate/', generate_mfa_qr, name='mfa_generate'),
    path('mfa/confirm/', confirm_mfa, name='mfa_confirm'),
    path('mfa/status/', mfa_status, name='mfa_status'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]

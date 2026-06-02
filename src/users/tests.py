from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from django.utils import timezone
from datetime import timedelta

from django_otp.plugins.otp_totp.models import TOTPDevice
from users.models import LoginAttempt


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/users/register/'

    def test_register_success(self):
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_register_password_mismatch(self):
        data = {
            'username': 'user2',
            'email': 'user2@example.com',
            'first_name': 'User',
            'last_name': 'Two',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass!',
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        data = {
            'username': 'user3',
            'email': 'user3@example.com',
            'first_name': 'User',
            'last_name': 'Three',
            'password': '1234',
            'password2': '1234',
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_fields(self):
        response = self.client.post(self.url, {'username': 'incomplete'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/users/login/'
        self.user = User.objects.create_user(
            username='loginuser',
            password='SecurePass123!',
            email='login@example.com',
            first_name='Login',
            last_name='User',
        )

    def test_login_success_returns_tokens(self):
        response = self.client.post(self.url, {'username': 'loginuser', 'password': 'SecurePass123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_password(self):
        response = self.client.post(self.url, {'username': 'loginuser', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_user(self):
        response = self.client.post(self.url, {'username': 'nobody', 'password': 'pass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_rate_limit_after_3_failures(self):
        for _ in range(3):
            LoginAttempt.objects.create(user=self.user, successful=False, is_mfa_attempt=False)
        response = self.client.post(self.url, {'username': 'loginuser', 'password': 'wrong'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_login_mfa_required_when_device_confirmed(self):
        TOTPDevice.objects.create(user=self.user, name='default', confirmed=True)
        response = self.client.post(self.url, {'username': 'loginuser', 'password': 'SecurePass123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('mfa_required'))
        self.assertNotIn('access', response.data)

    def test_login_records_successful_attempt(self):
        self.client.post(self.url, {'username': 'loginuser', 'password': 'SecurePass123!'})
        self.assertTrue(
            LoginAttempt.objects.filter(user=self.user, successful=True, is_mfa_attempt=False).exists()
        )

    def test_login_records_failed_attempt(self):
        self.client.post(self.url, {'username': 'loginuser', 'password': 'wrongpass'})
        self.assertTrue(
            LoginAttempt.objects.filter(user=self.user, successful=False, is_mfa_attempt=False).exists()
        )


class LogoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='logoutuser',
            password='SecurePass123!',
            email='logout@example.com',
            first_name='Logout',
            last_name='User',
        )

    def _login(self):
        resp = self.client.post('/api/users/login/', {'username': 'logoutuser', 'password': 'SecurePass123!'})
        return resp.data['access'], resp.data['refresh']

    def test_logout_blacklists_refresh_token(self):
        access, refresh = self._login()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        logout_resp = self.client.post('/api/users/logout/', {'refresh': refresh})
        self.assertEqual(logout_resp.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_resp = self.client.post('/api/users/token/refresh/', {'refresh': refresh})
        self.assertEqual(refresh_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        response = self.client.post('/api/users/logout/', {'refresh': 'fake'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class MFATests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='mfauser',
            password='SecurePass123!',
            email='mfa@example.com',
            first_name='MFA',
            last_name='User',
        )

    def test_mfa_confirm_valid_code_returns_tokens(self):
        TOTPDevice.objects.create(user=self.user, name='default', confirmed=True)
        with patch('django_otp.plugins.otp_totp.models.TOTPDevice.verify_token', return_value=True):
            response = self.client.post('/api/users/mfa/confirm/', {'username': 'mfauser', 'token': '123456'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_mfa_confirm_invalid_code_returns_400(self):
        TOTPDevice.objects.create(user=self.user, name='default', confirmed=True)
        with patch('django_otp.plugins.otp_totp.models.TOTPDevice.verify_token', return_value=False):
            response = self.client.post('/api/users/mfa/confirm/', {'username': 'mfauser', 'token': '000000'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mfa_confirm_rate_limit_after_3_failures(self):
        for _ in range(3):
            LoginAttempt.objects.create(user=self.user, successful=False, is_mfa_attempt=True)
        response = self.client.post('/api/users/mfa/confirm/', {'username': 'mfauser', 'token': '123456'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_mfa_confirm_missing_fields(self):
        response = self.client.post('/api/users/mfa/confirm/', {'username': 'mfauser'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mfa_generate_requires_authentication(self):
        response = self.client.get('/api/users/mfa/generate/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mfa_status_requires_authentication(self):
        response = self.client.get('/api/users/mfa/status/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GetUserTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='getuser',
            password='SecurePass123!',
            email='getuser@example.com',
            first_name='Get',
            last_name='User',
        )

    def _login(self):
        resp = self.client.post('/api/users/login/', {'username': 'getuser', 'password': 'SecurePass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')

    def test_get_user_returns_own_data(self):
        self._login()
        response = self.client.get('/api/users/get-user/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'getuser')
        self.assertEqual(response.data['email'], 'getuser@example.com')

    def test_get_user_unauthenticated_returns_401(self):
        response = self.client.get('/api/users/get-user/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDetailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='detailuser',
            password='SecurePass123!',
            email='detail@example.com',
            first_name='Detail',
            last_name='User',
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            password='SecurePass123!',
            email='other@example.com',
            first_name='Other',
            last_name='User',
        )

    def _login(self, username='detailuser'):
        resp = self.client.post('/api/users/login/', {'username': username, 'password': 'SecurePass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')

    def test_get_own_user_detail(self):
        self._login()
        response = self.client.get(f'/api/users/users/{self.user.pk}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'detailuser')

    def test_cannot_access_other_user_returns_403(self):
        self._login()
        response = self.client.get(f'/api/users/users/{self.other_user.pk}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_own_user_updates_email(self):
        self._login()
        response = self.client.patch(
            f'/api/users/users/{self.user.pk}/',
            {'email': 'newemail@example.com'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'newemail@example.com')

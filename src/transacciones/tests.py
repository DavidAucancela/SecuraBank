from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from decimal import Decimal

from accounts.models import Account
from transacciones.models import Transaction
from django_otp.plugins.otp_totp.models import TOTPDevice


class TransactionViewSetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='transuser',
            password='SecurePass123!',
            email='trans@example.com',
            first_name='Trans',
            last_name='User',
        )
        self.other_user = User.objects.create_user(
            username='otrotrans',
            password='SecurePass123!',
            email='otro@example.com',
            first_name='Otro',
            last_name='Trans',
        )
        resp = self.client.post('/api/users/login/', {'username': 'transuser', 'password': 'SecurePass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')

        self.from_account = Account.objects.get(user=self.user)
        self.from_account.saldo = Decimal('1000.00')
        self.from_account.save()

        self.to_account = Account.objects.get(user=self.other_user)

    def test_create_transaction_updates_balances(self):
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '100.00',
            'moneda': 'USD',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.from_account.refresh_from_db()
        self.to_account.refresh_from_db()
        self.assertEqual(self.from_account.saldo, Decimal('900.00'))
        self.assertEqual(self.to_account.saldo, Decimal('225.00'))

    def test_create_transaction_records_in_db(self):
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '50.00',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Transaction.objects.filter(user=self.user, monto=Decimal('50.00')).exists())

    def test_insufficient_funds_returns_400(self):
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '9999.00',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_insufficient_funds_does_not_change_balances(self):
        original_saldo = self.from_account.saldo
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '9999.00',
        }
        self.client.post('/api/transacciones/', data)
        self.from_account.refresh_from_db()
        self.assertEqual(self.from_account.saldo, original_saldo)

    def test_from_account_not_owned_returns_404(self):
        data = {
            'from_account': self.to_account.id,
            'to_account': self.from_account.id,
            'monto': '50.00',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_transactions_only_shows_own(self):
        Transaction.objects.create(
            user=self.user,
            from_account=self.from_account,
            to_account=self.to_account,
            monto=Decimal('30.00'),
            estado='completada',
        )
        Transaction.objects.create(
            user=self.other_user,
            from_account=self.to_account,
            to_account=self.from_account,
            monto=Decimal('20.00'),
            estado='completada',
        )
        response = self.client.get('/api/transacciones/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for trans in response.data:
            self.assertEqual(trans['user'], self.user.id)

    def test_create_transaction_requires_authentication(self):
        self.client.credentials()
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '50.00',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mfa_required_above_500_without_code(self):
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '600.00',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('MFA', str(response.data))

    def test_mfa_required_above_500_with_valid_code(self):
        TOTPDevice.objects.create(user=self.user, name='default', confirmed=True)
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '600.00',
            'mfa_code': '123456',
        }
        with patch('django_otp.plugins.otp_totp.models.TOTPDevice.verify_token', return_value=True):
            response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_mfa_required_above_500_with_invalid_code(self):
        TOTPDevice.objects.create(user=self.user, name='default', confirmed=True)
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '600.00',
            'mfa_code': '000000',
        }
        with patch('django_otp.plugins.otp_totp.models.TOTPDevice.verify_token', return_value=False):
            response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transaction_estado_completada(self):
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': '10.00',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['estado'], 'completada')

    def test_invalid_monto_returns_400(self):
        data = {
            'from_account': self.from_account.id,
            'to_account': self.to_account.id,
            'monto': 'abc',
        }
        response = self.client.post('/api/transacciones/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

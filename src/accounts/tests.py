from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import Account


class AccountSignalTests(TestCase):
    """El signal crea automáticamente una cuenta al registrar un usuario."""

    def test_account_created_on_user_creation(self):
        user = User.objects.create_user(username='signaluser', password='SecurePass123!')
        self.assertTrue(Account.objects.filter(user=user).exists())

    def test_default_account_has_125_balance(self):
        user = User.objects.create_user(username='balanceuser', password='SecurePass123!')
        account = Account.objects.get(user=user)
        self.assertEqual(float(account.saldo), 125.00)

    def test_default_account_name(self):
        user = User.objects.create_user(username='nameuser', password='SecurePass123!')
        account = Account.objects.get(user=user)
        self.assertEqual(account.name, 'Cuenta Principal')


class AccountAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='cuentauser',
            password='SecurePass123!',
            email='cuenta@example.com',
            first_name='Cuenta',
            last_name='User',
        )
        self.other_user = User.objects.create_user(
            username='otracuenta',
            password='SecurePass123!',
            email='otra@example.com',
            first_name='Otra',
            last_name='Cuenta',
        )
        resp = self.client.post('/api/users/login/', {'username': 'cuentauser', 'password': 'SecurePass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')

        self.account = Account.objects.get(user=self.user)
        self.other_account = Account.objects.get(user=self.other_user)

    def test_list_accounts_only_shows_own(self):
        response = self.client.get('/api/accounts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [a['id'] for a in response.data]
        self.assertIn(self.account.id, ids)
        self.assertNotIn(self.other_account.id, ids)

    def test_cannot_retrieve_other_users_account(self):
        response = self.client.get(f'/api/accounts/accounts/{self.other_account.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_requires_authentication(self):
        self.client.credentials()
        response = self.client.get('/api/accounts/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AccountCRUDTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='cruduser',
            password='SecurePass123!',
            email='crud@example.com',
            first_name='CRUD',
            last_name='User',
        )
        resp = self.client.post('/api/users/login/', {'username': 'cruduser', 'password': 'SecurePass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {resp.data["access"]}')
        self.account = Account.objects.get(user=self.user)

    def test_create_account_via_crear(self):
        data = {'name': 'Cuenta Ahorros', 'estado': 'activa'}
        response = self.client.post('/api/accounts/crear/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Account.objects.filter(user=self.user).count(), 2)

    def test_created_account_has_generated_account_number(self):
        data = {'name': 'Nueva Cuenta'}
        response = self.client.post('/api/accounts/crear/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        account_number = response.data.get('account_number')
        self.assertTrue(account_number.startswith('ACC-'))

    def test_create_account_via_viewset(self):
        data = {'name': 'Cuenta Inversión', 'estado': 'activa'}
        response = self.client.post('/api/accounts/accounts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_delete_own_account(self):
        extra = Account.objects.create(
            user=self.user,
            name='Para Borrar',
            account_number='ACC-DEL-001',
        )
        response = self.client.delete(f'/api/accounts/accounts/{extra.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Account.objects.filter(id=extra.id).exists())

    def test_retrieve_own_account(self):
        response = self.client.get(f'/api/accounts/accounts/{self.account.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.account.id)

    def test_all_accounts_accessible_to_authenticated_user(self):
        other = User.objects.create_user(username='otheruser2', password='SecurePass123!')
        response = self.client.get('/api/accounts/all-accounts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

import axios from 'axios';

// Obtener todas las cuentas del usuario logueado
export const fetchCuentas = async () => {
  const response = await axios.get('/api/accounts/');
  return response.data;
};

// Crear nueva cuenta
export const crearCuenta = async (accountNumber) => {
  const response = await axios.post('/api/accounts/', {
    account_number: accountNumber,
  });
  return response.data;
};

// (Opcional) Eliminar cuenta
export const eliminarCuenta = async (id) => {
  const response = await axios.delete(`/api/accounts/${id}/`);
  return response.data;
};

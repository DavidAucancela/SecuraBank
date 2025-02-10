import api from './axiosInstance';

// Realizar una transferencia
export const realizarTransferencia = async (transferData) => {
  try {
    const response = await api.post('/transacciones/realizar_transferencia/', transferData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Obtener todas las transacciones del usuario
export const getTransactions = async () => {
  try {
    const response = await api.get('/transacciones/');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Obtener las cuentas del usuario
export const getUserAccounts = async () => {
  try {
    const response = await api.get('/accounts/user-accounts/');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Obtener todas las cuentas (solo si tu API lo permite)
export const getAllAccounts = async () => {
  try {
    const response = await api.get('/accounts/all-accounts/');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Verificar MFA
export const verifyMFAAPI = async (data) => {
  try {
    const response = await api.post('/transacciones/verify-mfa/', data);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};
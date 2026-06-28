import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Interceptor para autenticación
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Operaciones con cuentas
export const getUserAccounts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/accounts/`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Operaciones con transacciones
export const realizarTransferencia = async (transferData) => {
  try {
    const response = await axios.post(`${BASE_URL}/transacciones/`, transferData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export const getTransactions = async (page = 1, pageSize = 10) => {
  try {
    const response = await axios.get(`${BASE_URL}/transacciones/`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Eliminado: verifyMFAAPI (si no está implementado en el backend)
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/transactions/';

// Función para obtener el token desde el contexto o localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Realizar una transferencia
export const realizarTransferencia = async (transferData) => {
  const token = getAuthToken();
  const config = {
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
  };

  try {
      const response = await axios.post(`${API_URL}realizar_transferencia/`, transferData, config);
      return response.data;
  } catch (error) {
      throw error.response ? error.response.data : error;
  }
};

// Obtener todas las transacciones del usuario
export const getTransactions = async () => {
  const token = getAuthToken();
  const config = {
      headers: {
          'Authorization': `Bearer ${token}`,
      },
  };

  try {
      const response = await axios.get(`${API_URL}`, config);
      return response.data;
  } catch (error) {
      throw error.response ? error.response.data : error;
  }
};

// Obtener las cuentas del usuario
export const getUserAccounts = async () => {
  const token = getAuthToken();
  const config = {
      headers: {
          'Authorization': `Bearer ${token}`,
      },
  };

  try {
      const response = await axios.get('http://localhost:8000/api/accounts/', config); // Aquí puedes cambiar la URL según tu backend
      return response.data;
  } catch (error) {
      throw error.response ? error.response.data : error;
  }
};
// transaccionesAPI.js
import axios from 'axios';

// La URL base debe apuntar a "/api/transacciones/" (no a "/api/").
const API_URL = 'http://127.0.0.1:8000/api/transacciones/';

// LISTAR todas (o filtrar por cuenta) las transacciones
export const fetchTransacciones = async (cuentaId) => {
  // Endpoint base -> /api/transacciones/transactions/
  let url = `${API_URL}transactions/`;
  // Si quieres filtrar por cuenta -> ?cuenta_id=XYZ
  if (cuentaId) {
    url += `?cuenta_id=${cuentaId}`;
  }

  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`, 
    },
  });
  return res.data;
};

// CREAR una transacción
export const crearTransaccion = async (data) => {
  // data => { cuenta_origen, cuenta_destino, monto }
  // POST /api/transacciones/transactions/
  const res = await axios.post(`${API_URL}transactions/`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return res.data;
};

// REVERTIR una transacción (solo superuser)
export const revertirTransaccion = async (id) => {
  // POST /api/transacciones/transactions/:id/revertir/
  const res = await axios.post(`${API_URL}transactions/${id}/revertir/`, null, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return res.data;
};

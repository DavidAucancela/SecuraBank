// frontend/src/api/TransaccionesAPI.js
import axios from 'axios';

// LISTAR todas las transacciones
export const fetchTransacciones = async () => {
  const res = await axios.get('/api/transactions/');
  return res.data;
};

// CREAR una transacción
export const crearTransaccion = async (data) => {
  // data => { cuenta_origen, cuenta_destino, monto }
  const res = await axios.post('/api/transactions/', data);
  return res.data;
};

// REVERTIR una transacción (solo superuser)
export const revertirTransaccion = async (id) => {
  // POST /api/transactions/:id/revertir/
  const res = await axios.post(`/api/transactions/${id}/revertir/`);
  return res.data;
};

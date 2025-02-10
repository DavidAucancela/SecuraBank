import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Crear la instancia
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor de request que añade el token en la cabecera, si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;

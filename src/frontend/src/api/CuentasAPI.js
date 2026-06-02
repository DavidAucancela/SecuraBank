import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/accounts/';

const cuentasApi = axios.create({
  baseURL: BASE_URL,
});

cuentasApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

cuentasApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const resp = await axios.post('http://localhost:8000/api/users/token/refresh/', { refresh: refreshToken });
          const newAccess = resp.data.access;
          localStorage.setItem('access_token', newAccess);
          if (resp.data.refresh) localStorage.setItem('refresh_token', resp.data.refresh);
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          return axios(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const fetchCuentas = async () => {
  const response = await cuentasApi.get('/');
  return response.data;
};

export const crearCuenta = async (name) => {
  const response = await cuentasApi.post('/accounts/', { name });
  return response.data;
};

export const eliminarCuenta = async (id) => {
  const response = await cuentasApi.delete(`/accounts/${id}/`);
  return response.data;
};

export const lookupCuenta = async (number) => {
  try {
    const response = await cuentasApi.get(`/lookup/?number=${encodeURIComponent(number)}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

export default cuentasApi;

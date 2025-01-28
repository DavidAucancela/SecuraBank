import axios from 'axios';

// URL base para la API de Cuentas (ajusta el puerto/protocolo si es necesario)
const BASE_URL = 'http://localhost:8000/api/accounts/';

const cuentasApi = axios.create({
  baseURL: BASE_URL,
});

// Interceptor de REQUEST: agrega token (si existe) a la cabecera Authorization
cuentasApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE: intenta refrescar el token si recibe un 401
cuentasApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Verifica que sea un 401 y que no se haya reintentado ya
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Intento de refrescar el token
          const resp = await axios.post('http://localhost:8000/api/users/token/refresh/', {
            refresh: refreshToken,
          });
          // Guardo el nuevo token
          localStorage.setItem('access_token', resp.data.access);

          // Repito la solicitud original con el nuevo token
          originalRequest.headers['Authorization'] = `Bearer ${resp.data.access}`;
          return axios(originalRequest);
        } catch (err) {
          console.error('Error al refrescar token:', err);
          // Podrías forzar cierre de sesión o redirigir a login
        }
      }
    }
    return Promise.reject(error);
  }
);

/** Obtiene todas las cuentas del usuario autenticado */
export const fetchCuentas = async () => {
  const response = await cuentasApi.get('/');
  return response.data;
};

/** Crea una nueva cuenta (solo necesita account_number) */
export const crearCuenta = async (accountNumber) => {
  const response = await cuentasApi.post('/', { account_number: accountNumber });
  return response.data;
};

/** Elimina una cuenta por ID */
export const eliminarCuenta = async (id) => {
  const response = await cuentasApi.delete(`/${id}/`);
  return response.data;
};

// (Opcional) Podrías exportar otras funciones para editar, depositar, retirar, etc.
// export const editarCuenta = ...

export default cuentasApi;

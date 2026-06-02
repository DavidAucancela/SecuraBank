import axios from 'axios';

const API_URL = 'http://localhost:8000/api/users/';

const api = axios.create({
    baseURL: API_URL,
});

// Adjunta el access token a cada request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intenta renovar el access token cuando expira (401). Si falla, redirige al login.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        'http://localhost:8000/api/users/token/refresh/',
                        { refresh: refreshToken }
                    );
                    const newAccess = response.data.access;
                    localStorage.setItem('access_token', newAccess);
                    if (response.data.refresh) {
                        localStorage.setItem('refresh_token', response.data.refresh);
                    }
                    originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
                    return axios(originalRequest);
                } catch (err) {
                    // Refresh inválido o expirado — limpiar sesión y redirigir al login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                    return Promise.reject(err);
                }
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

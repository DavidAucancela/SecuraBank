import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Importación corregida
import api from '../api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [authTokens, setAuthTokens] = useState(() => {
        const access = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');
        return access && refresh ? { access, refresh } : null;
    });
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('access_token');
        return token ? jwtDecode(token) : null; // Actualizado
    });
    const [isMfaRequired, setIsMfaRequired] = useState(false);

    const loginUser = async (username, password) => {
        try {
            const response = await api.post('login/', { username, password });
            setAuthTokens(response.data);
            setUser(jwtDecode(response.data.access)); // Actualizado
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            // Verificar si MFA está configurado
            const mfaResponse = await api.get('mfa/status/');
            setIsMfaRequired(mfaResponse.data.mfa_required);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Credenciales inválidas.' };
        }
    };

    const logoutUser = async () => {
        try {
            await api.post('logout/', { refresh: authTokens.refresh });
        } catch (error) {
            console.error('Logout error:', error);
        }
        setAuthTokens(null);
        setUser(null);
        setIsMfaRequired(false);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    const updateToken = async () => {
        if (authTokens) {
            try {
                const response = await api.post('token/refresh/', { refresh: authTokens.refresh });
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access)); // Actualizado
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
            } catch (error) {
                console.error('Error al refrescar token:', error);
                logoutUser();
            }
        }
    };

    useEffect(() => {
        let interval;
        if (authTokens) {
            const decoded = jwtDecode(authTokens.access); // Actualizado
            const expiresAt = decoded.exp * 1000;
            const timeout = expiresAt - Date.now() - 60000; // Refrescar 1 minuto antes de expirar
            if (timeout > 0) {
                interval = setTimeout(() => {
                    updateToken();
                }, timeout);
            }
        }
        return () => clearTimeout(interval);
    }, [authTokens]);

    return (
        <AuthContext.Provider value={{ user, authTokens, loginUser, logoutUser, isMfaRequired, setAuthTokens }}>
            {children}
        </AuthContext.Provider>
    );
};
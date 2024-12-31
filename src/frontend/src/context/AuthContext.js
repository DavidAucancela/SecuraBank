import React, { createContext, useState, useEffect } from 'react';
// Importación con named export
import { jwtDecode } from 'jwt-decode';

import api from '../api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [authTokens, setAuthTokens] = useState(() => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return (access && refresh) ? { access, refresh } : null;
  });

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('access_token');
    // Usar jwtDecode, en minúscula/camelCase
    return token ? jwtDecode(token) : null;
  });

  const [isMfaRequired, setIsMfaRequired] = useState(false);

  const loginUser = async (username, password) => {
    try {
      const response = await api.post('login/', { username, password });

      if (response.data.mfa_required) {
        setIsMfaRequired(true);
        return { success: true, mfaRequired: true };
      } else {
        const { access, refresh } = response.data;
        setIsMfaRequired(false);

        setAuthTokens({ access, refresh });
        // De nuevo, usar jwtDecode
        setUser(jwtDecode(access));

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        return { success: true, mfaRequired: false };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Credenciales inválidas.' };
    }
  };

  const logoutUser = async () => {
    try {
      if (authTokens?.refresh) {
        await api.post('logout/', { refresh: authTokens.refresh });
      }
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
        const response = await api.post('token/refresh/', {
          refresh: authTokens.refresh,
        });
        const { access, refresh } = response.data;

        setAuthTokens({ access, refresh });
        // Llamar jwtDecode
        setUser(jwtDecode(access));

        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
      } catch (error) {
        console.error('Error al refrescar token:', error);
        logoutUser();
      }
    }
  };

  useEffect(() => {
    let interval;
    if (authTokens) {
      // Llamar jwtDecode
      const decoded = jwtDecode(authTokens.access);
      const expiresAt = decoded.exp * 1000;
      const tiempoRestante = expiresAt - Date.now();

      const refrescarEn = tiempoRestante - 60000;
      if (refrescarEn > 0) {
        interval = setTimeout(() => {
          updateToken();
        }, refrescarEn);
      }
    }
    return () => clearTimeout(interval);
  }, [authTokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        authTokens,
        isMfaRequired,
        setIsMfaRequired,
        loginUser,
        logoutUser,
        setAuthTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

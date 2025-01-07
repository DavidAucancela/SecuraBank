// src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Importación nombrada correcta

import axios from 'axios';

// Crear el contexto
export const AuthContext = createContext();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    return access && refresh ? { access, refresh } : null;
  });

  const [user, setUser] = useState(() => {
    if (authTokens) {
      try {
        return jwtDecode(authTokens.access);
      } catch (error) {
        console.error('Error decodificando JWT:', error);
        return null;
      }
    }
    return null;
  });

  const [isMfaRequired, setIsMfaRequired] = useState(false);

  // Función para iniciar sesión
  const loginUser = async (username, password) => {
    try {
      const res = await axios.post(
        'http://localhost:8000/api/users/login/',
        { 
          username, 
          password 
        }
      );

      if (res.status === 200) {
        const data = res.data;

        if (data.mfa_required) {
          // MFA requerido
          return { success: true, mfaRequired: true };
        } else {
          // MFA no requerido, almacenar tokens
          const { access, refresh } = data;
          if (access && refresh) {
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            setAuthTokens({ access, refresh });
            setUser(jwtDecode(access));
            return { success: true, mfaRequired: false };
          } else {
            return { success: false, message: 'Respuesta inesperada del servidor.' };
          }
        }
      } else {
        return { success: false, message: 'Error al iniciar sesión.' };
      }
    } catch (error) {
      console.error('Error en loginUser:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        return { success: false, message: error.response.data.detail };
      } else if (error.response && error.response.status === 429) {
        return { success: false, message: 'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.' };
      } else {
        return { success: false, message: 'Error al iniciar sesión.' };
      }
    }
  };

  // Función para confirmar MFA
  const confirmMFA = async (username, token) => {
    try {
      const res = await axios.post(
        'http://localhost:8000/api/users/mfa/confirm/',
        { 
          username, 
          token 
        }
      );

      if (res.status === 200) {
        const { access, refresh } = res.data;
        if (access && refresh) {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          setAuthTokens({ access, refresh });
          setUser(jwtDecode(access));
          return { success: true };
        } else {
          return { success: false, message: 'Respuesta inesperada del servidor al confirmar MFA.' };
        }
      } else {
        return { success: false, message: 'Error al confirmar MFA.' };
      }
    } catch (error) {
      console.error('Error en confirmMFA:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        return { success: false, message: error.response.data.detail };
      } else if (error.response && error.response.status === 429) {
        return { success: false, message: 'Demasiados intentos fallidos de MFA. Inténtalo de nuevo más tarde.' };
      } else {
        return { success: false, message: 'Error al confirmar MFA.' };
      }
    }
  };

  // Función para cerrar sesión
  const logoutUser = async () => {
    try {
      if (authTokens?.refresh) {
        await axios.post(
          'http://localhost:8000/api/users/logout/',
          { refresh: authTokens.refresh },
          {
            headers: {
              'Authorization': `Bearer ${authTokens.access}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    setAuthTokens(null);
    setUser(null);
    setIsMfaRequired(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  // Función para renovar tokens
  const updateToken = async () => {
    if (authTokens) {
      try {
        const response = await axios.post(
          'http://localhost:8000/api/users/token/refresh/',
          { refresh: authTokens.refresh }
        );
        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        setAuthTokens({ access, refresh });
        setUser(jwtDecode(access));
      } catch (error) {
        console.error('Error al renovar token:', error);
        logoutUser();
      }
    }
  };

  useEffect(() => {
    let interval;
    if (authTokens) {
      try {
        const decoded = jwtDecode(authTokens.access);
        const expiresAt = decoded.exp * 1000;
        const tiempoRestante = expiresAt - Date.now();

        const refrescarEn = tiempoRestante - 60000; // Renovar 1 minuto antes de expirar
        if (refrescarEn > 0) {
          interval = setTimeout(() => {
            updateToken();
          }, refrescarEn);
        }
      } catch (error) {
        console.error('Error decodificando token en useEffect:', error);
        logoutUser();
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
        confirmMFA,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

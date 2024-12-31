// MFA.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const MFA = () => {
  const { partialUsername, setPartialUsername,
          setAuthTokens, setUser } = useContext(AuthContext);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Importante: enviar user + token TOTP
      const resp = await api.post('mfa/confirm/', {
        username: partialUsername,
        token, 
      });
      // Devuelve { access, refresh, detail }
      const { access, refresh } = resp.data;
      // Guardar tokens
      setAuthTokens({ access, refresh });
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // Si quieres decodificar y setear user:
      //   import { jwtDecode } from 'jwt-decode';
      //   setUser(jwtDecode(access));

      // Limpiar partialUsername
      setPartialUsername(null);
      // Navegar a dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Token MFA inválido.');
    }
  };

  return (
    <div>
      <h2>Autenticación MFA</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Código MFA (TOTP):</label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <button type="submit">Verificar</button>
      </form>
    </div>
  );
};

export default MFA;

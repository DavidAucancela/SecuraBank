import React, { useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MFA = () => {
    const { setAuthTokens } = useContext(AuthContext);
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('mfa/confirm/', { token });
            // Suponiendo que el backend devuelve nuevos tokens después de MFA
            setAuthTokens(response.data);
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            navigate('/dashboard');
        } catch (error) {
            setError('Token MFA inválido.');
        }
    };

    return (
        <div>
            <h2>Autenticación Multifactor</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Token MFA:</label>
                    <input 
                        type="text" 
                        value={token} 
                        onChange={(e) => setToken(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Verificar</button>
            </form>
        </div>
    );
};

export default MFA;

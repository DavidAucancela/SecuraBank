import React, { useState } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';

const PasswordReset = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('password-reset/', { email });
            setMessage(response.data.detail);
            setError('');
        } catch (error) {
            setError(error.response.data.detail);
            setMessage('');
        }
    };

    return (
        <div>
            <h2>Restablecer Contraseña</h2>
            {message && <p style={{ color: 'green' }}>{message}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Enviar Enlace de Restablecimiento</button>
            </form>
            <p>
                ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
            </p>
        </div>
    );
};

export default PasswordReset;
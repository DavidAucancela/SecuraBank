import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const { loginUser, isMfaRequired } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await loginUser(formData.username, formData.password);
        if (response.success) {
            if (isMfaRequired) {
                navigate('/mfa');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError(response.message);
        }
    };

    return (
        <div>
            <h2>Iniciar Sesión</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Usuario:</label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Contraseña:</label>
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <button type="submit">Ingresar</button>
            </form>
            <p>
                ¿Olvidaste tu contraseña? <Link to="/password-reset">Restablecer aquí</Link>
            </p>
            <p>
                ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
            </p>
        </div>
    );
};

export default Login;

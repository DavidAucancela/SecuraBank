// src/components/Auth/PasswordResetConfirm.js

import React, { useState } from 'react';
import api from '../../api';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import zxcvbn from 'zxcvbn';

const PasswordResetConfirm = () => {
    const navigate = useNavigate();
    const query = new URLSearchParams(useLocation().search);
    const uid = query.get('uid');
    const token = query.get('token');

    const [formData, setFormData] = useState({
        new_password: '',
        new_password2: '',
    });
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'new_password') {
            const strength = zxcvbn(e.target.value);
            setPasswordStrength(strength.score);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('password-reset-confirm/', { uid, token, ...formData });
            navigate('/login');
        } catch (error) {
            setErrors(error.response.data);
        }
    };

    const getPasswordStrengthLabel = () => {
        switch (passwordStrength) {
            case 0:
                return 'Muy débil';
            case 1:
                return 'Débil';
            case 2:
                return 'Regular';
            case 3:
                return 'Fuerte';
            case 4:
                return 'Muy fuerte';
            default:
                return '';
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 0:
                return 'red';
            case 1:
                return 'orange';
            case 2:
                return 'yellow';
            case 3:
                return 'lightgreen';
            case 4:
                return 'green';
            default:
                return 'transparent';
        }
    };

    return (
        <div>
            <h2>Restablecer Contraseña</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nueva Contraseña:</label>
                    <input 
                        type="password" 
                        name="new_password" 
                        value={formData.new_password} 
                        onChange={handleChange} 
                        required 
                    />
                    {passwordStrength !== null && (
                        <p style={{ color: getPasswordStrengthColor() }}>
                            Fortaleza de la contraseña: {getPasswordStrengthLabel()}
                        </p>
                    )}
                    {errors.new_password && <p style={{ color: 'red' }}>{errors.new_password}</p>}
                </div>
                <div>
                    <label>Confirmar Nueva Contraseña:</label>
                    <input 
                        type="password" 
                        name="new_password2" 
                        value={formData.new_password2} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.new_password2 && <p style={{ color: 'red' }}>{errors.new_password2}</p>}
                </div>
                <button type="submit">Restablecer Contraseña</button>
            </form>
            <p>
                ¿Ya has restablecido tu contraseña? <Link to="/login">Inicia Sesión</Link>
            </p>
        </div>
    );
};

export default PasswordResetConfirm;

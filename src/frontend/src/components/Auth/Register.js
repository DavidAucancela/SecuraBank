import React, { useState } from 'react';
import api from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import zxcvbn from 'zxcvbn';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
    });
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'password') {
            const strength = zxcvbn(e.target.value);
            setPasswordStrength(strength.score);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('register/', formData);
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
            <h2>Registro</h2>
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
                    {errors.username && <p style={{ color: 'red' }}>{errors.username}</p>}
                </div>
                <div>
                    <label>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
                </div>
                <div>
                    <label>Nombre:</label>
                    <input 
                        type="text" 
                        name="first_name" 
                        value={formData.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.first_name && <p style={{ color: 'red' }}>{errors.first_name}</p>}
                </div>
                <div>
                    <label>Apellido:</label>
                    <input 
                        type="text" 
                        name="last_name" 
                        value={formData.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.last_name && <p style={{ color: 'red' }}>{errors.last_name}</p>}
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
                    {passwordStrength !== null && (
                        <p style={{ color: getPasswordStrengthColor() }}>
                            Fortaleza de la contraseña: {getPasswordStrengthLabel()}
                        </p>
                    )}
                    {errors.password && <p style={{ color: 'red' }}>{errors.password}</p>}
                </div>
                <div>
                    <label>Confirmar Contraseña:</label>
                    <input 
                        type="password" 
                        name="password2" 
                        value={formData.password2} 
                        onChange={handleChange} 
                        required 
                    />
                    {errors.password2 && <p style={{ color: 'red' }}>{errors.password2}</p>}
                </div>
                <button type="submit">Registrarse</button>
            </form>
            <p>
                ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
            </p>
        </div>
    );
};

export default Register;

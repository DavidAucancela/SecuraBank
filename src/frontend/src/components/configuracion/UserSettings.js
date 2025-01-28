
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserSettings = () => {
    const [user, setUser] = useState({
        email: '',
        first_name: '',
        last_name: '',
    });
    const [message, setMessage] = useState('');


    useEffect(() => {
        // Obtener datos del usuario
        axios.get('/api/accounts/user/', {
            headers: {
                Authorization: `Token ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            setUser({
                email: response.data.email,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
            });
        })
        .catch(error => {
            console.error(error);
        });
    }, []);

    const handleChange = (e) => {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.put('/api/accounts/user/', user, {
            headers: {
                Authorization: `Token ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            setMessage('Datos actualizados correctamente.');
        })
        .catch(error => {
            console.error(error);
            setMessage('Error al actualizar los datos.');
        });
    };

    return (
        <div className="user-settings">
            <h2>Configuración de Usuario</h2>
            {message && <p>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={user.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Nombre:</label>
                    <input 
                        type="text" 
                        name="first_name" 
                        value={user.first_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <div>
                    <label>Apellido:</label>
                    <input 
                        type="text" 
                        name="last_name" 
                        value={user.last_name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                <button type="submit">Guardar Cambios</button>
            </form>
            <p>
                ¿Olvidaste tu contraseña?{' '}
                <Link to="../Auth/password-reset">Restablecer aquí</Link>
            </p>        
        </div>
    );
};

export default UserSettings;

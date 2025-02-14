import React, { useState, useEffect } from 'react';
import API from '../../api/UsuariosAPI';
import UserForm from '../configuracion/UserForm';

const UserSettings = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        API.get('/users/1/')  // Suponiendo que el usuario tiene ID 1
            .then(response => setUser(response.data))
            .catch(error => console.error(error));
    }, []);

    const handleUpdate = (updatedUser) => {
        API.put(`/users/${updatedUser.id}/`, updatedUser)
            .then(response => setUser(response.data))
            .catch(error => console.error(error));
    };

    return (
        <div>
            <h2>Configuración del Usuario</h2>
            {user && <UserForm user={user} onUpdate={handleUpdate} />}
        </div>
    );
};

export default UserSettings;

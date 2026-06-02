import React, { useState, useEffect, useContext } from 'react';
import API from '../../api/UsuariosAPI';
import UserForm from '../configuracion/UserForm';
import { AuthContext } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const UserSettings = () => {
    const { user: authUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!authUser) return;
        API.get('/get-user/')
            .then(response => setUser(response.data))
            .catch(error => console.error(error));
    }, [authUser]);

    const handleUpdate = (updatedUser) => {
        if (!authUser?.user_id) return;
        API.patch(`/users/${authUser.user_id}/`, updatedUser)
            .then(response => {
                setUser(response.data);
                Swal.fire('Guardado', 'Perfil actualizado correctamente.', 'success');
            })
            .catch(() => Swal.fire('Error', 'No se pudo actualizar el perfil.', 'error'));
    };

    return (
        <div>
            <h2>Configuración del Usuario</h2>
            {user && <UserForm user={user} onUpdate={handleUpdate} />}
        </div>
    );
};

export default UserSettings;

import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logoutUser } = useContext(AuthContext);

    return (
        <div>
            <h2>Dashboard</h2>
            <p>Bienvenido, {user.username}!</p>
            <button onClick={logoutUser}>Cerrar Sesión</button>
        </div>
    );
};

export default Dashboard;

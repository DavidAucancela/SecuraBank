import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
  
    // Si no hay usuario, redirige a /login
    if (!user) {
      return <Navigate to="/login" />;
    }
  
    // Si está logueado, muestra el contenido
    return children;
  };
export default PrivateRoute;

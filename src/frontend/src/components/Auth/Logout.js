import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Logout = () => {
    const { logoutUser } = useContext(AuthContext);

    useEffect(() => {
        logoutUser();
    }, [logoutUser]);

    return null;
};

export default Logout;

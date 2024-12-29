import React from 'react';
//import Transacciones from "./components/Transacciones";

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PasswordReset from './components/Auth/PasswordReset';
import PasswordResetConfirm from './components/Auth/PasswordResetConfirm';
import MFA from './components/Auth/MFA';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';


function App() {
    return (
        <Router>
            <div>
                <h1>Admin Panel con React y Django</h1>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    <Route path="/reset-password" element={<PasswordResetConfirm />} />
                    <Route path="/mfa" element={<MFA />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;

//const App = () => {
//    return (
//        <div>
//            <Transacciones />
//        </div>
//    );
//};


import React from 'react';
//import Transacciones from "./components/Transacciones";

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

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
            <AuthProvider>
            <div className="text-center mt-4">
                <h1 className="mt-3">SecuraBank</h1>
            </div>
                
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
            </AuthProvider>
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


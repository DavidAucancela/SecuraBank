import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

//autenticación
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PasswordReset from './components/Auth/PasswordReset';
import PasswordResetConfirm from './components/Auth/PasswordResetConfirm';
import MFA from './components/Auth/MFA';

//componentes principales
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';

//transacciones
import TransaccionesPage from './components/transacciones/TransaccionesPage';

//Cuentas:
import CuentasPage from './components/cuentas/CuentasPage';


function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="text-center mt-4">
                    <h1 className="mt-3">SecuraBank</h1>
                </div>
                
                <Routes>
                    {/* Cuando visite http://localhost:3000/api/transacciones */}
                    <Route path="/api/transacciones" element={<TransaccionesPage />} />     
                    
                    {/* Rutas públicas */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    <Route path="/reset-password" element={<PasswordResetConfirm />} />
                    <Route path="/mfa" element={<MFA />} />
                    <Route path="/transacciones" element={<TransaccionesPage />} />
                    <Route path="/cuentas" element={<CuentasPage />} />
                    
                    {/* Rutas protegidas (privadas) */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />

                    {/* Redirección de la raíz al dashboard */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;


import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Autenticación
import MFA from './components/Auth/MFA';

// Restablecer contraseña
import PasswordReset from './components/Auth/PasswordReset';
import PasswordResetConfirm from './components/Auth/PasswordResetConfirm';


// Componentes principales
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Cuentas
import CuentasPage from './components/cuentas/CuentasPage';

// Transacciones
import TransaccionesPage from './components/transacciones/TransaccionesPage';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="text-center mt-4">
                    <h1 className="mt-3">SecuraBank</h1>
                </div>
                
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/password-reset" element={<PasswordReset />} />
                    <Route path="/reset-password" element={<PasswordResetConfirm />} />
                    <Route path="/mfa" element={<MFA />} />
                    <Route path="/transacciones" element={<TransaccionesPage />} />
                    
                    {/* Rutas protegidas (privadas) */}
                    <Route 
                        path="/cuentas" 
                        element={
                            <PrivateRoute>
                                <CuentasPage />
                            </PrivateRoute>
                        }
                    />
    
                    {/* Redirección de la raíz al login */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;

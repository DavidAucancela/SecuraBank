import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MFA from './components/Auth/MFA';
import PasswordReset from './components/Auth/PasswordReset';
import PasswordResetConfirm from './components/Auth/PasswordResetConfirm';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CuentasPage from './components/cuentas/CuentasPage';
import Layout from './components/Layout';
import TransactionPage from './components/transacciones/TransactionPage';
import UserSettings from './components/configuracion/UserSettings';
import DashboardPage from './components/dashboard/DashboardPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/reset-password" element={<PasswordResetConfirm />} />
          <Route path="/mfa" element={<MFA />} />

          {/* Rutas privadas */}
          <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
          <Route path="/cuentas" element={<PrivateRoute><Layout><CuentasPage /></Layout></PrivateRoute>} />
          <Route path="/transacciones" element={<PrivateRoute><Layout><TransactionPage /></Layout></PrivateRoute>} />
          <Route path="/configuracion" element={<PrivateRoute><Layout><UserSettings /></Layout></PrivateRoute>} />

          {/* Raíz redirige al dashboard si está autenticado, si no al login */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

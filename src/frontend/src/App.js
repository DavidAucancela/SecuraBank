import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Contexto de autenticación
import MFA from './components/Auth/MFA'; // Autenticación de doble factor
import PasswordReset from './components/Auth/PasswordReset'; // Restablecimiento de contraseña
import PasswordResetConfirm from './components/Auth/PasswordResetConfirm'; // Confirmación de restablecimiento de contraseña
import PrivateRoute from './components/PrivateRoute'; // Ruta protegida
import Login from './components/Auth/Login'; // Página de inicio de sesión
import Register from './components/Auth/Register'; // Página de registro
import CuentasPage from './components/cuentas/CuentasPage'; // Página de cuentas
import TransaccionesPage from './components/transacciones/TransaccionesPage'; // Página de transacciones
// import ConfiguracionPage from './pages/ConfiguracionPage'; // Página de configuración (si la tienes)
import Layout from './components/Layout';

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

          <Route path="/cuentas/:id" element={<TransaccionesPage />} />

          {/* Rutas privadas */}
          <Route
            path="/cuentas"
            element={
              <PrivateRoute>
                <Layout>
                  <CuentasPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transacciones"
            element={
              <PrivateRoute>
                <Layout>
                  <TransaccionesPage />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <PrivateRoute>
                <Layout>
                  {/* <ConfiguracionPage />  Descomenta si tienes un componente real */}
                  <h2>Página de Configuración (ejemplo)</h2>
                </Layout>
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

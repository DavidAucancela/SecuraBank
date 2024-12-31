import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const Login = () => {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estados para campos y errores
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Estados para manejar errores individuales
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Estado para mostrar el spinner/loader
  const [loading, setLoading] = useState(false);

  // Validamos manualmente antes de enviar
  const validateFields = () => {
    let valid = true;
    setUsernameError('');
    setPasswordError('');

    if (!username.trim()) {
      setUsernameError('El usuario es requerido');
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError('La contraseña es requerida');
      valid = false;
    }

    return valid;
  };

  // Lógica de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar campos
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    const response = await loginUser(username, password);
    setLoading(false);

    if (response.success) {
      if (response.mfaRequired) {
        // Si el backend indicó que MFA está activo,
        // redirigimos a la vista MFA
        navigate('/mfa');
      } else {
        // De lo contrario, ya tenemos tokens, ir a dashboard
        navigate('/dashboard');
      }
    } else {
      // Credenciales inválidas: mostramos SweetAlert2
      Swal.fire({
        title: 'Error',
        text: response.message, // o el mensaje que te devuelva tu API
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Iniciar Sesión</h2>
              <form onSubmit={handleSubmit}>

                {/* Campo Usuario */}
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    className={`form-control ${usernameError ? 'is-invalid' : ''}`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {usernameError && (
                    <div className="invalid-feedback">{usernameError}</div>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {passwordError && (
                    <div className="invalid-feedback">{passwordError}</div>
                  )}
                </div>

                {/* Botón con spinner */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p>
                  ¿Olvidaste tu contraseña?{' '}
                  <Link to="/password-reset">Restablecer aquí</Link>
                </p>
                <p>
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register">Regístrate</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

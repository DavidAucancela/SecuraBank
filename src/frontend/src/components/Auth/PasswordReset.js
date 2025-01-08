import React, { useState } from 'react';
import api from '../../api';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const PasswordReset = () => {
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
     // Enviar tanto el usuario como el correo electrónico al backend
      const response = await api.post('password-reset/', { email });
      setMessage(response.data.detail);
      setError('');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ha ocurrido un error');
      setMessage('');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
            <h2 className="text-center mb-4">Restablecer Contraseña</h2>

              {/* Mensajes de éxito o error */}
              {message && (
                <div className="alert alert-success" role="alert">
                  {message}
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Nuevo campo para el usuario */}
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Campo existente para el correo electrónico */}
                <div className="mb-3">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

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
                      Enviando...
                    </>
                  ) : (
                    'Enviar Enlace de Restablecimiento'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <p>
                  ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;

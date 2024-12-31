import React, { useState } from 'react';
import api from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import Swal from 'sweetalert2';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);

    // Verificar la fortaleza de la contraseña al cambiar
    if (e.target.name === 'password') {
      const strength = zxcvbn(e.target.value);
      setPasswordStrength(strength.score); // valor entre 0 y 4
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('register/', formData);

      // 1) Mostrar alerta de éxito con SweetAlert2
      Swal.fire({
        title: '¡Registro exitoso!',
        text: 'Usuario creado exitosamente.',
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        // 2) Redireccionar después de que el usuario cierre la alerta
        navigate('/login');
      });

    } catch (error) {
      // Manejo de errores
      setErrors(error.response.data);
    }
  };

  // Retorna una etiqueta en texto según el valor de la fortaleza
  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return 'Muy débil';
      case 1: return 'Débil';
      case 2: return 'Regular';
      case 3: return 'Fuerte';
      case 4: return 'Muy fuerte';
      default: return '';
    }
  };

  // Retorna la clase de Bootstrap (color) para la barra de progreso
  const getPasswordStrengthClass = () => {
    switch (passwordStrength) {
      case 0: return 'bg-danger';
      case 1: return 'bg-warning';
      case 2: return 'bg-info';
      case 3: return 'bg-primary';
      case 4: return 'bg-success';
      default: return '';
    }
  };

  // Retorna el ancho de la barra de progreso en %
  const getPasswordStrengthWidth = () => {
    if (passwordStrength === null) return 0;
    return ((passwordStrength + 1) / 5) * 100; 
    // (score + 1) / 5 para convertir [0..4] en un rango [1..5] y luego a porcentaje
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Registro</h2>

              <form onSubmit={handleSubmit}>
                {/* Usuario */}
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    name="username"
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username}</div>
                  )}
                </div>

                {/* Correo */}
                <div className="mb-3">
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                {/* Nombre */}
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    name="first_name"
                    className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                  {errors.first_name && (
                    <div className="invalid-feedback">{errors.first_name}</div>
                  )}
                </div>

                {/* Apellido */}
                <div className="mb-3">
                  <label className="form-label">Apellido</label>
                  <input
                    type="text"
                    name="last_name"
                    className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                  {errors.last_name && (
                    <div className="invalid-feedback">{errors.last_name}</div>
                  )}
                </div>

                {/* Contraseña */}
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}

                  {passwordStrength !== null && (
                    <div className="mt-2">
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar ${getPasswordStrengthClass()}`}
                          role="progressbar"
                          style={{ width: `${getPasswordStrengthWidth()}%` }}
                          aria-valuenow={getPasswordStrengthWidth()}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        />
                      </div>
                      <small className="text-muted">
                        Fortaleza: <strong>{getPasswordStrengthLabel()}</strong>
                      </small>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="mb-3">
                  <label className="form-label">Confirmar Contraseña</label>
                  <input
                    type="password"
                    name="password2"
                    className={`form-control ${errors.password2 ? 'is-invalid' : ''}`}
                    value={formData.password2}
                    onChange={handleChange}
                    required
                  />
                  {errors.password2 && (
                    <div className="invalid-feedback">{errors.password2}</div>
                  )}
                </div>

                {/* Botón de Registro con Spinner */}
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
                      Registrando...
                    </>
                  ) : (
                    'Registrarse'
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

export default Register;

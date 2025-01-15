import React, { useState } from 'react';
import api from '../../api';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import zxcvbn from 'zxcvbn';

const PasswordResetConfirm = () => {
    const navigate = useNavigate();
    const query = new URLSearchParams(useLocation().search);
    const uid = query.get('uid');
    const token = query.get('token');

    // Estado para almacenar los datos del formulario
    const [formData, setFormData] = useState({
        new_password: '',
        new_password2: '',
    });
    
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    
    // Función para manejar los cambios en los campos del formulario
    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'new_password') {
            const strength = zxcvbn(e.target.value);
            setPasswordStrength(strength.score);
        }
    };

    // Función para enviar el formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const response = await api.post('password-reset-confirm/', { uid, token, ...formData });
            setSuccessMessage("Contraseña restablecida con éxito. Redirigiendo...");
            setTimeout(() => navigate("/login"), 3000);
        } catch (error) {
            setErrorMessage(
              error.response?.data?.detail || "Hubo un error al restablecer la contraseña."
            );
            setErrors(error.response?.data || {});
          } finally {
            setLoading(false);
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
              <h2 className="text-center mb-4">Restablecer Contraseña</h2>

              {/* Mensajes de éxito o error */}
              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Campo de nueva contraseña */}
                <div className="mb-3">
                  <label className="form-label">Nueva Contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    //className="form-control"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    required
                  />
                  
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

                {/* Campo de confirmar nueva contraseña */}
                <div className="mb-3">
                  <label className="form-label">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    name="new_password2"
                    value={formData.new_password2}
                    onChange={handleChange}
                    required
                  />
                  {errors.new_password2 && (
                    <div className="text-danger">{errors.new_password2}</div>
                  )}
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
                      Restableciendo...
                    </>
                  ) : (
                    "Restablecer Contraseña"
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

export default PasswordResetConfirm;

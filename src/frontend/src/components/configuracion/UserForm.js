import React, { useState } from "react";
import Swal from "sweetalert2";

const UserForm = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState(user);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Manejo de cambios en los inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validaciones de formulario
  const validateFields = () => {
    let newErrors = {};
    if (!formData.username.trim()) newErrors.username = "El nombre de usuario es obligatorio.";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Correo inválido.";
    if (!formData.phone.trim() || !/^\d+$/.test(formData.phone)) newErrors.phone = "El teléfono debe ser numérico.";
    if (!formData.address.trim()) newErrors.address = "La dirección no puede estar vacía.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) return;

    setLoading(true);
    try {
      await onUpdate(formData);
      Swal.fire({
        icon: "success",
        title: "¡Datos actualizados!",
        text: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al actualizar",
        text: "Hubo un problema al actualizar los datos.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-center mb-4">Editar Perfil</h3>
              <form onSubmit={handleSubmit}>
                {/* Nombre de usuario */}
                <div className="mb-3">
                  <label className="form-label">Nombre de usuario</label>
                  <input
                    type="text"
                    name="username"
                    className={`form-control ${errors.username ? "is-invalid" : ""}`}
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                </div>

                {/* Correo electrónico */}
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Teléfono */}
                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="text"
                    name="phone"
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                {/* Dirección */}
                <div className="mb-3">
                  <label className="form-label">Dirección</label>
                  <textarea
                    name="address"
                    className={`form-control ${errors.address ? "is-invalid" : ""}`}
                    value={formData.address}
                    onChange={handleChange}
                  />
                  {errors.address && <div className="invalid-feedback">{errors.address}</div>}
                </div>

                {/* Botón de guardar */}
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserForm;

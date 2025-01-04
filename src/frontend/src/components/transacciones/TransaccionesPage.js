import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
// Importar las funciones de API que obtienen y crean transacciones
// Ajusta la ruta de importación a la correcta en tu proyecto
import { fetchTransacciones, crearTransaccion } from '../../api/TransaccionesAPI';

const TransaccionesPage = () => {
  // Estados para formulario
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [monto, setMonto] = useState('');

  // Estados para validación/campos vacíos
  const [cuentaOrigenError, setCuentaOrigenError] = useState('');
  const [cuentaDestinoError, setCuentaDestinoError] = useState('');
  const [montoError, setMontoError] = useState('');

  // Estado para manejar el spinner (loading)
  const [loading, setLoading] = useState(false);

  // Estado para las transacciones (listado)
  const [transacciones, setTransacciones] = useState([]);

  // Cargar todas las transacciones al montar el componente
  useEffect(() => {
    cargarTransacciones();
  }, []);

  const cargarTransacciones = async () => {
    setLoading(true);
    try {
      const data = await fetchTransacciones();
      setTransacciones(data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar las transacciones',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  // Validar campos
  const validateFields = () => {
    let valid = true;
    setCuentaOrigenError('');
    setCuentaDestinoError('');
    setMontoError('');

    if (!cuentaOrigen.trim()) {
      setCuentaOrigenError('La cuenta origen es requerida');
      valid = false;
    }
    if (!cuentaDestino.trim()) {
      setCuentaDestinoError('La cuenta destino es requerida');
      valid = false;
    }
    if (!monto || monto <= 0) {
      setMontoError('El monto debe ser mayor a 0');
      valid = false;
    }
    return valid;
  };

  // Envío del formulario para crear transacción
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setLoading(true);
    try {
      const nueva = await crearTransaccion({
        cuenta_origen: cuentaOrigen,
        cuenta_destino: cuentaDestino,
        monto,
      });

      if (nueva.estado === 'fallida') {
        // El backend decidió rechazar o no hay saldo
        Swal.fire({
          title: 'Transacción Fallida',
          text: 'No se pudo procesar la transacción (verifica el saldo o datos)',
          icon: 'error',
          confirmButtonText: 'OK',
        });
      } else if (nueva.estado === 'completada') {
        Swal.fire({
          title: 'Transacción Exitosa',
          text: 'La transacción se ha creado correctamente',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      }
      // Limpiar campos y recargar lista
      setCuentaOrigen('');
      setCuentaDestino('');
      setMonto('');
      cargarTransacciones();
    } catch (error) {
      console.error('Error al crear transacción:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al crear la transacción',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        {/* Formulario de creación de transacción */}
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Crear Nueva Transacción</h2>
              <form onSubmit={handleSubmit}>
                {/* Cuenta Origen */}
                <div className="mb-3">
                  <label className="form-label">Cuenta Origen</label>
                  <input
                    type="text"
                    className={`form-control ${
                      cuentaOrigenError ? 'is-invalid' : ''
                    }`}
                    value={cuentaOrigen}
                    onChange={(e) => setCuentaOrigen(e.target.value)}
                  />
                  {cuentaOrigenError && (
                    <div className="invalid-feedback">{cuentaOrigenError}</div>
                  )}
                </div>

                {/* Cuenta Destino */}
                <div className="mb-3">
                  <label className="form-label">Cuenta Destino</label>
                  <input
                    type="text"
                    className={`form-control ${
                      cuentaDestinoError ? 'is-invalid' : ''
                    }`}
                    value={cuentaDestino}
                    onChange={(e) => setCuentaDestino(e.target.value)}
                  />
                  {cuentaDestinoError && (
                    <div className="invalid-feedback">{cuentaDestinoError}</div>
                  )}
                </div>

                {/* Monto */}
                <div className="mb-3">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${montoError ? 'is-invalid' : ''}`}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                  {montoError && (
                    <div className="invalid-feedback">{montoError}</div>
                  )}
                </div>

                {/* Botón con spinner */}
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Procesando...
                    </>
                  ) : (
                    'Crear Transacción'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de transacciones */}
      <div className="row justify-content-center mt-5">
        <div className="col-md-10">
          <h3 className="mb-3">Historial de Transacciones</h3>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status" />
              <p>Cargando transacciones...</p>
            </div>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cuenta Origen</th>
                  <th>Cuenta Destino</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No hay transacciones registradas.
                    </td>
                  </tr>
                ) : (
                  transacciones.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{tx.cuenta_origen}</td>
                      <td>{tx.cuenta_destino}</td>
                      <td>{tx.monto}</td>
                      <td>{tx.estado}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransaccionesPage;

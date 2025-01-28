// src/components/transacciones/TransaccionesPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { fetchTransacciones, crearTransaccion } from '../../api/TransaccionesAPI';

const TransaccionesPage = () => {
  // 1) Leer el :id de la URL (cuenta actual)
  const { id } = useParams(); // p.ej. /cuentas/7 -> id=7

  // 2) Estados del formulario
  const [cuentaOrigen] = useState(id || '');
  //const [setOrigen] = useState(id || '');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [monto, setMonto] = useState('');

  // 3) Errores de validación
  const [cuentaDestinoError, setCuentaDestinoError] = useState('');
  const [montoError, setMontoError] = useState('');

  // 4) Loading + listado de transacciones
  const [loading, setLoading] = useState(false);
  const [transacciones, setTransacciones] = useState([]);

  // 5) Cargar transacciones al montar o cambiar 'id'
  useEffect(() => {
    cargarTransacciones(id);
  }, [id]);

  const cargarTransacciones = async (cuentaId) => {
    setLoading(true);
    try {
      // fetchTransacciones(cuentaId) hace GET a /api/transacciones/ con ?cuenta_id=...
      const data = await fetchTransacciones(cuentaId);
      setTransacciones(data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      Swal.fire('Error', 'No se pudieron cargar las transacciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateFields = () => {
    let valid = true;
    setCuentaDestinoError('');
    setMontoError('');

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
        Swal.fire(
          'Transacción Fallida',
          'No se pudo procesar la transacción (saldo insuficiente o error).',
          'error'
        );
      } else if (nueva.estado === 'completada') {
        Swal.fire('Transacción Exitosa', 'Transacción creada correctamente', 'success');
      } else {
        // Por si llega estado 'proceso' y falta MFA u otra lógica
        Swal.fire('Transacción en proceso', 'Pendiente de confirmación', 'info');
      }

      // Limpiar campos y recargar lista
      setCuentaDestino('');
      setMonto('');
      cargarTransacciones(id);
    } catch (error) {
      console.error('Error al crear transacción:', error);
      Swal.fire(
        'Error',
        error?.response?.data?.detail || 'Hubo un problema al crear la transacción',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Formulario */}
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Crear Nueva Transacción</h2>
              <form onSubmit={handleSubmit}>
                {/* Cuenta Origen (fijada si estamos en /cuentas/:id) */}
                {id && (
                  <div className="mb-3">
                    <label className="form-label">Cuenta Origen</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cuentaOrigen}
                      readOnly
                    />
                  </div>
                )}

                {/* Cuenta Destino */}
                <div className="mb-3">
                  <label className="form-label">Cuenta Destino</label>
                  <input
                    type="text"
                    className={`form-control ${cuentaDestinoError ? 'is-invalid' : ''}`}
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
                  {montoError && <div className="invalid-feedback">{montoError}</div>}
                </div>

                {/* Botón */}
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

      {/* Listado de transacciones de la cuenta (o de todas si no hay id) */}
      <div className="row justify-content-center mt-5">
        <div className="col-md-10">
          <h3 className="mb-3">
            {id
              ? `Historial de Transacciones de la cuenta ${id}`
              : 'Historial de Transacciones'}
          </h3>
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
                      {/* Si el back envía objetos embebidos, por ejemplo 
                          { cuenta_origen: { id, account_number }, ... } 
                          ajusta esta parte */}
                      <td>{tx.cuenta_origen.account_number}</td>
                      <td>{tx.cuenta_destino.account_number}</td>
                      <td>${tx.monto}</td>
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

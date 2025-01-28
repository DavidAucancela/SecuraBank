import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { fetchCuentas, crearCuenta, eliminarCuenta } from '../../api/CuentasAPI';
import { Link } from 'react-router-dom';

const CuentasPage = () => {
  const [accountNumber, setAccountNumber] = useState('');
  const [accountNumberError, setAccountNumberError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    setLoading(true);
    try {
      const data = await fetchCuentas();
      setCuentas(data);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      Swal.fire('Error', 'No se pudieron cargar las cuentas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateFields = () => {
    let valid = true;
    setAccountNumberError('');
    if (!accountNumber.trim()) {
      setAccountNumberError('El número de cuenta es requerido');
      valid = false;
    }
    return valid;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setLoading(true);
    try {
      const nueva = await crearCuenta(accountNumber);
      Swal.fire('Cuenta creada', `Se ha creado la cuenta ${nueva.account_number}`, 'success');
      setAccountNumber('');
      cargarCuentas();
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      Swal.fire('Error', 'No se pudo crear la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    const confirmResult = await Swal.fire({
      title: '¿Eliminar cuenta?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    try {
      await eliminarCuenta(id);
      Swal.fire('Eliminada', 'La cuenta ha sido eliminada', 'success');
      cargarCuentas();
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      Swal.fire('Error', 'No se pudo eliminar la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        {/* Formulario para crear cuentas */}
        <div className="col-md-6">
          <div className="card mt-5">
            <div className="card-body">
              <h2 className="text-center mb-4">Crear Nueva Cuenta</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Número de Cuenta</label>
                  <input
                    type="text"
                    className={`form-control ${accountNumberError ? 'is-invalid' : ''}`}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  {accountNumberError && (
                    <div className="invalid-feedback">{accountNumberError}</div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creando...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de cuentas */}
      <div className="row justify-content-center mt-5">
        <div className="col-md-10">
          <h3 className="mb-3">Mis Cuentas</h3>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status" />
              <p>Cargando...</p>
            </div>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Número de Cuenta</th>
                  <th>Saldo</th>
                  <th>Modificar</th>
                  <th>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {cuentas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No tienes cuentas registradas
                    </td>
                  </tr>
                ) : (
                  cuentas.map((cuenta) => (
                    <tr key={cuenta.id}>
                      <td>{cuenta.id}</td>
                      <td>{cuenta.account_number}</td>
                      <td>{cuenta.saldo}</td>
                      <td>
                        {/* Link hacia la vista de transacciones de esta cuenta */}
                        <Link to={`/cuentas/${cuenta.id}`} className="btn btn-primary btn-sm me-2">
                          Ver transacciones
                        </Link>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleEliminar(cuenta.id)}
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </td>
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

export default CuentasPage;

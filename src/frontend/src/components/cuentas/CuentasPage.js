import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { fetchCuentas, crearCuenta, eliminarCuenta } from '../../api/CuentasAPI';

const CuentasPage = () => {
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { cargarCuentas(); }, []);

  const cargarCuentas = async () => {
    setLoading(true);
    try {
      const data = await fetchCuentas();
      setCuentas(data);
    } catch {
      Swal.fire('Error', 'No se pudieron cargar las cuentas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nueva = await crearCuenta(accountName || 'Nueva Cuenta');
      Swal.fire('Cuenta creada', `Número asignado: ${nueva.account_number}`, 'success');
      setAccountName('');
      cargarCuentas();
    } catch {
      Swal.fire('Error', 'No se pudo crear la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar cuenta?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    try {
      await eliminarCuenta(id);
      setCuentas(prev => prev.filter(c => c.id !== id));
    } catch {
      Swal.fire('Error', 'No se pudo eliminar la cuenta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, number) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="container my-4">

      {/* Formulario nueva cuenta */}
      <div className="row justify-content-center mb-4">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Nueva Cuenta</h5>
              <form onSubmit={handleSubmit} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="Nombre (opcional)"
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="btn text-white text-nowrap"
                  style={{ backgroundColor: '#006666' }}
                  disabled={loading}
                >
                  {loading
                    ? <span className="spinner-border spinner-border-sm" />
                    : '+ Crear'}
                </button>
              </form>
              <small className="text-muted mt-1 d-block">El número de cuenta se genera automáticamente.</small>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de cuentas */}
      {loading && cuentas.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status" />
        </div>
      ) : cuentas.length === 0 ? (
        <p className="text-center text-muted py-4">No tienes cuentas registradas.</p>
      ) : (
        <div className="row g-3 justify-content-center">
          {cuentas.map(cuenta => (
            <div key={cuenta.id} className="col-xl-3 col-md-4 col-sm-6">
              <div className="card shadow-sm h-100" style={{ borderTop: '3px solid #006666' }}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="card-title mb-0 fw-bold text-truncate">{cuenta.name}</h6>
                    <span className={`badge ms-2 flex-shrink-0 bg-${cuenta.estado === 'activa' ? 'success' : 'secondary'}`}>
                      {cuenta.estado}
                    </span>
                  </div>

                  <div className="d-flex align-items-center mb-3">
                    <code className="text-muted me-1" style={{ fontSize: '0.78rem' }}>
                      {cuenta.account_number}
                    </code>
                    <button
                      className="btn btn-sm btn-link p-0 text-decoration-none"
                      title="Copiar número de cuenta"
                      onClick={() => handleCopy(cuenta.id, cuenta.account_number)}
                    >
                      <span style={{ fontSize: '0.9rem' }}>
                        {copiedId === cuenta.id ? '✓' : '⎘'}
                      </span>
                    </button>
                  </div>

                  <div className="mt-auto">
                    <p className="mb-3 fw-bold" style={{ fontSize: '1.6rem', color: '#006666' }}>
                      ${parseFloat(cuenta.saldo).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => handleEliminar(cuenta.id)}
                      disabled={loading}
                    >
                      Eliminar cuenta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CuentasPage;

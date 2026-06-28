import React, { useEffect, useState, useContext } from 'react';
import { getUserAccounts, realizarTransferencia, getTransactions } from '../../api/TransaccionesAPI';
import { lookupCuenta } from '../../api/CuentasAPI';
import { AuthContext } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const TransactionPage = () => {
  const { user: authUser } = useContext(AuthContext);
  const [userAccounts, setUserAccounts] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null, page: 1 });

  const [fromAccount, setFromAccount] = useState('');
  const [destinoMode, setDestinoMode] = useState('propia');
  const [toAccount, setToAccount] = useState('');
  const [destNumero, setDestNumero] = useState('');
  const [destInfo, setDestInfo] = useState(null);
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [mfaCode, setMfaCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [transaccionesLoading, setTransaccionesLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const needsMfa = Number(monto) > 500;
  const selectedAccount = userAccounts.find(a => a.id === parseInt(fromAccount));
  const userAccountIds = new Set(userAccounts.map(a => a.id));

  useEffect(() => {
    getUserAccounts()
      .then(setUserAccounts)
      .catch(() => Swal.fire('Error', 'No se pudieron cargar las cuentas', 'error'));
    fetchTransactions(1);
  }, []);

  const fetchTransactions = async (page) => {
    setTransaccionesLoading(true);
    try {
      const data = await getTransactions(page);
      setTransacciones(Array.isArray(data.results) ? data.results : []);
      setPagination({ count: data.count, next: data.next, previous: data.previous, page });
    } catch {
      setTransacciones([]);
    } finally {
      setTransaccionesLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!destNumero.trim()) return;
    setLookupLoading(true);
    setDestInfo(null);
    setToAccount('');
    try {
      const info = await lookupCuenta(destNumero.trim());
      setDestInfo(info);
      setToAccount(info.id);
    } catch (err) {
      const msg = err?.error || 'Cuenta no encontrada.';
      Swal.fire('No encontrada', msg, 'error');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleDestinoModeChange = (mode) => {
    setDestinoMode(mode);
    setToAccount('');
    setDestNumero('');
    setDestInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !monto) {
      Swal.fire('Error', 'Completa todos los campos obligatorios.', 'error');
      return;
    }
    if (Number(monto) <= 0) {
      Swal.fire('Error', 'El monto debe ser mayor a 0.', 'error');
      return;
    }
    if (String(fromAccount) === String(toAccount)) {
      Swal.fire('Error', 'La cuenta de origen y destino no pueden ser la misma.', 'error');
      return;
    }
    if (needsMfa && !mfaCode) {
      Swal.fire('Error', 'Ingresa tu código MFA para transferencias mayores a $500.', 'error');
      return;
    }

    setLoading(true);
    try {
      const nuevaTransaccion = await realizarTransferencia({
        from_account: fromAccount,
        to_account: toAccount,
        monto,
        moneda,
        ...(needsMfa && { mfa_code: mfaCode }),
      });

      Swal.fire('¡Transferencia exitosa!', `Se transfirieron $${Number(monto).toFixed(2)} ${moneda}`, 'success');

      setFromAccount('');
      setToAccount('');
      setDestNumero('');
      setDestInfo(null);
      setMonto('');
      setMoneda('USD');
      setMfaCode('');

      const updated = await getUserAccounts();
      setUserAccounts(updated);
      fetchTransactions(1);
    } catch (error) {
      const msg = error?.error || error?.detail || 'No se pudo realizar la transferencia.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDir = (trans) => {
    if (userAccountIds.has(trans.from_account?.id)) return 'enviada';
    if (userAccountIds.has(trans.to_account?.id)) return 'recibida';
    return 'enviada';
  };

  const btnTeal = { backgroundColor: '#006666', color: 'white', border: 'none' };

  return (
    <div className="container my-4">
      <div className="row g-4">

        {/* Columna formulario */}
        <div className="col-lg-5">
          {selectedAccount ? (
            <div className="card border-0 shadow-sm mb-3" style={{ borderLeft: '4px solid #006666' }}>
              <div className="card-body py-3">
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>CUENTA DE ORIGEN</p>
                <h6 className="fw-bold mb-0">{selectedAccount.name}</h6>
                <code className="text-muted" style={{ fontSize: '0.78rem' }}>{selectedAccount.account_number}</code>
                <div className="mt-2">
                  <span className="fw-bold fs-5" style={{ color: '#006666' }}>
                    ${parseFloat(selectedAccount.saldo).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted ms-1" style={{ fontSize: '0.8rem' }}>disponible</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-light border mb-3">
              <small className="text-muted">Selecciona una cuenta de origen para ver el saldo disponible.</small>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-4">Nueva Transferencia</h5>
              <form onSubmit={handleSubmit}>

                {/* Origen */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Cuenta de Origen</label>
                  <select
                    className="form-select"
                    value={fromAccount}
                    onChange={e => setFromAccount(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccionar...</option>
                    {userAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} — ${parseFloat(a.saldo).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destino con toggle */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Cuenta de Destino</label>
                  <div className="btn-group w-100 mb-2" role="group">
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={destinoMode === 'propia' ? btnTeal : {}}
                      onClick={() => handleDestinoModeChange('propia')}
                    >
                      Mis cuentas
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={destinoMode === 'externa' ? btnTeal : {}}
                      onClick={() => handleDestinoModeChange('externa')}
                    >
                      Otro usuario
                    </button>
                  </div>

                  {destinoMode === 'propia' ? (
                    <select
                      className="form-select"
                      value={toAccount}
                      onChange={e => setToAccount(e.target.value)}
                      required
                      disabled={loading}
                    >
                      <option value="">Seleccionar...</option>
                      {userAccounts
                        .filter(a => String(a.id) !== String(fromAccount))
                        .map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} — {a.account_number}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="ACC-XXXXXXXXXX"
                          value={destNumero}
                          onChange={e => {
                            setDestNumero(e.target.value.toUpperCase());
                            setDestInfo(null);
                            setToAccount('');
                          }}
                          disabled={loading || lookupLoading}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleLookup}
                          disabled={!destNumero.trim() || lookupLoading}
                        >
                          {lookupLoading
                            ? <span className="spinner-border spinner-border-sm" />
                            : 'Buscar'}
                        </button>
                      </div>
                      {destInfo && (
                        <div className="alert alert-success py-2 px-3 mt-2 mb-0" style={{ fontSize: '0.85rem' }}>
                          ✓ <strong>{destInfo.owner}</strong> — <code>{destInfo.account_number}</code>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Monto y moneda */}
                <div className="row g-2 mb-3">
                  <div className="col-7">
                    <label className="form-label fw-semibold">Monto</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="col-5">
                    <label className="form-label fw-semibold">Moneda</label>
                    <select
                      className="form-select"
                      value={moneda}
                      onChange={e => setMoneda(e.target.value)}
                      disabled={loading}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="MXN">MXN</option>
                    </select>
                  </div>
                </div>

                {/* MFA */}
                {needsMfa && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Código MFA{' '}
                      <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                        Requerido &gt;$500
                      </span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={mfaCode}
                      onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Código de 6 dígitos"
                      maxLength={6}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn w-100 fw-semibold mt-1"
                  style={btnTeal}
                  disabled={loading || (destinoMode === 'externa' && !destInfo)}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Procesando...</>
                    : 'Transferir'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Columna historial */}
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Historial de Transferencias</h5>
                {pagination.count > 0 && (
                  <small className="text-muted">{pagination.count} en total</small>
                )}
              </div>
              {transaccionesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-secondary" role="status" />
                </div>
              ) : transacciones.length === 0 ? (
                <p className="text-muted text-center py-5 mb-0">No hay transferencias registradas.</p>
              ) : (
                <>
                  <div className="list-group list-group-flush">
                    {transacciones.map(trans => {
                      const isEnviada = getDir(trans) === 'enviada';
                      const contraparte = isEnviada ? trans.to_account : trans.from_account;
                      return (
                        <div key={trans.id} className="list-group-item px-0 py-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <span className={`badge me-2 ${isEnviada ? 'bg-danger' : 'bg-success'}`}>
                                {isEnviada ? '↑ Enviada' : '↓ Recibida'}
                              </span>
                              <small className="text-muted">
                                {isEnviada ? 'A: ' : 'De: '}
                                <code>{contraparte?.account_number}</code>
                              </small>
                            </div>
                            <div className="text-end">
                              <div className={`fw-bold ${isEnviada ? 'text-danger' : 'text-success'}`}>
                                {isEnviada ? '−' : '+'}$
                                {parseFloat(trans.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                                {trans.moneda}
                              </div>
                              <small className="text-muted">
                                {new Date(trans.fecha).toLocaleString('es-ES', {
                                  day: '2-digit', month: '2-digit', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(pagination.previous || pagination.next) && (
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={!pagination.previous}
                        onClick={() => fetchTransactions(pagination.page - 1)}
                      >
                        ← Anterior
                      </button>
                      <small className="text-muted">Página {pagination.page}</small>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={!pagination.next}
                        onClick={() => fetchTransactions(pagination.page + 1)}
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionPage;

// src/components/TransactionsPage.js
import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import {
  getUserAccounts,
  realizarTransferencia,
  getTransactions,
  verifyMFAAPI,
} from '../../api/TransaccionesAPI';
import { AuthContext } from '../../context/AuthContext';

const TransactionPage = () => {
  // Extrae authTokens en lugar de token
  const { authTokens } = useContext(AuthContext);
  // console.log('authTokens:', authTokens);

  // Estados para cuentas y formulario
  const [userAccounts, setUserAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('USD');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para transacciones
  const [transacciones, setTransacciones] = useState([]);
  const [transaccionesLoading, setTransaccionesLoading] = useState(false);

  // Estado para indicar si MFA fue verificado
  const [mfaVerified, setMfaVerified] = useState(false);

  // Obtener las cuentas del usuario
  useEffect(() => {
    const fetchUserAccounts = async () => {
      setLoading(true);
      try {
        const accounts = await getUserAccounts();
        setUserAccounts(accounts);
        //console.log('Cuentas obtenidas:', accounts);
      } catch (err) {
        console.error('Error al obtener las cuentas', err);
        Swal.fire('Error', 'No se pudieron cargar las cuentas', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (authTokens && authTokens.access) fetchUserAccounts();
  }, [authTokens]);

  // Obtener las transacciones del usuario
  useEffect(() => {
    const fetchTransacciones = async () => {
      setTransaccionesLoading(true);
      try {
        const trans = await getTransactions();
        console.log('Transacciones obtenidas:', trans); // Mira aquí qué te llega
        setTransacciones(trans);
      } catch (err) {
        console.error('Error al obtener transacciones', err);
        Swal.fire('Error', 'No se pudieron cargar las transacciones', 'error');
      } finally {
        setTransaccionesLoading(false);
      }
    };

    if (authTokens && authTokens.access) fetchTransacciones();
  }, [authTokens]);

  // Mostrar/ocultar campo MFA según el monto
  useEffect(() => {
    if (parseFloat(monto) > 500) {
      setShowMfa(true);
    } else {
      setShowMfa(false);
      setMfaCode('');
      setMfaVerified(false);
    }
  }, [monto]);

  // Función para verificar el código MFA
  const handleVerifyMFA = async () => {
    if (!mfaCode) {
      Swal.fire('Error', 'Ingresa el código MFA para verificar.', 'error');
      return;
    }
    try {
      const response = await verifyMFAAPI({ mfa_code: mfaCode });
      Swal.fire('Éxito', response.detail, 'success');
      setMfaVerified(true);
    } catch (error) {
      console.error('Error al verificar MFA:', error);
      Swal.fire('Error', error.response?.data?.detail || 'Código MFA inválido.', 'error');
      setMfaVerified(false);
    }
  };

  // Función para manejar el envío de la transferencia
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (fromAccount === toAccount) {
      Swal.fire('Error', 'La cuenta de origen y destino no pueden ser iguales.', 'error');
      return;
    }

    if (!fromAccount || !toAccount || !monto || !moneda) {
      Swal.fire('Error', 'Por favor, completa todos los campos requeridos.', 'error');
      return;
    }

    // Si el monto supera 500, se requiere que MFA ya haya sido verificado
    if (parseFloat(monto) > 500 && !mfaVerified) {
      Swal.fire('Error', 'Verifica el código MFA antes de enviar la transferencia.', 'error');
      return;
    }

    const transferData = {
      from_account: fromAccount,
      to_account: toAccount,
      monto: monto,
      moneda: moneda,
      ubicacion: 'Online',
      ...(parseFloat(monto) > 500 && { mfa_code: mfaCode }),
    };

    setLoading(true);
    try {
      const response = await realizarTransferencia(transferData);
      Swal.fire('Éxito', `Transferencia realizada exitosamente. ID: ${response.id}`, 'success');

      // Resetear el formulario y el estado de MFA
      setFromAccount('');
      setToAccount('');
      setMonto('');
      setMoneda('USD');
      setMfaCode('');
      setShowMfa(false);
      setMfaVerified(false);

      // Actualizar listas
      const accounts = await getUserAccounts();
      setUserAccounts(accounts);
      //console.log('Cuentas actualizadas:', accounts);

      const trans = await getTransactions();
      setTransacciones(trans);
      //console.log('Transacciones actualizadas:', trans);
    } catch (err) {
      console.error('Error al realizar la transferencia:', err);
      Swal.fire('Error', err.response?.data?.detail || 'Ocurrió un error al realizar la transferencia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Encuentra el objeto de la cuenta seleccionada para origen
  const selectedAccount = userAccounts.find(account => account.id === parseInt(fromAccount));

  return (
    <div className="container my-4">
      {/* Información visual de la cuenta de origen seleccionada */}
      <div className="mb-4">
        {selectedAccount ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Información de la Cuenta de Origen</h5>
              <p className="card-text mb-1"><strong>Nombre:</strong> {selectedAccount.name}</p>
              <p className="card-text mb-1"><strong>Número:</strong> {selectedAccount.account_number}</p>
              <p className="card-text mb-1"><strong>Propietario:</strong> {selectedAccount.owner}</p>
              <p className="card-text"><strong>Saldo:</strong> ${selectedAccount.saldo}</p>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            Selecciona una cuenta de origen para ver su información y saldo.
          </div>
        )}
      </div>

      {/* Formulario para realizar transferencias */}
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="text-center mb-4">Realizar Transferencia</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Cuenta de Origen</label>
                  <select
                    className="form-select"
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccione una cuenta</option>
                    {userAccounts.length > 0 ? (
                      userAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No hay cuentas disponibles</option>
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Cuenta de Destino</label>
                  <select
                    className="form-select"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccione una cuenta</option>
                    {userAccounts.length > 0 ? (
                      userAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>No hay cuentas disponibles</option>
                    )}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Monto</label>
                  <input
                    type="number"
                    className="form-control"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Moneda</label>
                  <select
                    className="form-select"
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="USD">USD - Dólar estadounidense</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - Libra esterlina</option>
                    <option value="JPY">JPY - Yen japonés</option>
                    <option value="MXN">MXN - Peso mexicano</option>
                    <option value="CAD">CAD - Dólar canadiense</option>
                    <option value="AUD">AUD - Dólar australiano</option>
                    <option value="CHF">CHF - Franco suizo</option>
                    <option value="CNY">CNY - Yuan chino</option>
                    <option value="SEK">SEK - Corona sueca</option>
                  </select>
                </div>

                {showMfa && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Código MFA</label>
                      <input
                        type="text"
                        className="form-control"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        required={showMfa}
                        disabled={loading || mfaVerified}
                      />
                    </div>
                    <div className="mb-3">
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleVerifyMFA}
                        disabled={loading || mfaVerified}
                      >
                        {mfaVerified ? 'MFA Verificado' : 'Verificar MFA'}
                      </button>
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Procesando...
                    </>
                  ) : (
                    'Enviar Transferencia'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de transacciones recientes */}
      <div className="row justify-content-center mt-5">
        <div className="col-md-10">
          <h3 className="mb-3">Transferencias Recientes</h3>
          {transaccionesLoading ? (
            <div className="text-center">
              <div className="spinner-border" role="status" />
              <p>Cargando...</p>
            </div>
          ) : transacciones.length === 0 ? (
            <p>No hay transacciones realizadas.</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Monto</th>
                  <th>Moneda</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((trans) => (
                  <tr key={trans.id}>
                    <td>{trans.id}</td>
                    <td>{trans.from_account.account_number}</td>
                    <td>{trans.to_account.account_number}</td>
                    <td>{trans.monto}</td>
                    <td>{trans.moneda}</td>
                    <td>{new Date(trans.fecha).toLocaleString()}</td>
                    <td>{trans.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;

import React, { useEffect, useState } from 'react';
import { getUserAccounts, realizarTransferencia, getTransactions } from '../../api/TransaccionesAPI';
import Swal from 'sweetalert2';

const TransactionPage = () => {
  const [userAccounts, setUserAccounts] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Datos del formulario
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('USD');

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [transaccionesLoading, setTransaccionesLoading] = useState(false);
  
  // Obtener las cuentas del usuario
  useEffect(() => {
    const fetchUserAccounts = async () => {
      try {
        const accounts = await getUserAccounts();
        setUserAccounts(accounts);
      } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar las cuentas', 'error');
      }
    };

    fetchUserAccounts();
  }, []);

  // Obtener transacciones
  useEffect(() => {
    const fetchTransactions = async () => {
      setTransaccionesLoading(true);
      try {
        const data = await getTransactions();
        // Asegúrate de que data sea un array
        if (Array.isArray(data)) {
          setTransacciones(data);
        } else {
          console.error('Respuesta de transacciones no es un array:', data);
          setTransacciones([]);
        }
      } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar las transacciones.', 'error');
        setTransacciones([]);
      } finally {
        setTransaccionesLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Cuando se cambia la cuenta de origen, obtener la info para mostrar
  useEffect(() => {
    if (fromAccount) {
      const account = userAccounts.find(acc => acc.id === fromAccount);
      setSelectedAccount(account);
    } else {
      setSelectedAccount(null);
    }
  }, [fromAccount, userAccounts]);
  
  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fromAccount || !toAccount || !monto) {
      Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
      return;
    }
    if (Number(monto) <= 0) {
      Swal.fire('Error', 'El monto debe ser mayor a 0.', 'error');
      return;
    }

    const transferData = {
      from_account: fromAccount,
      to_account: toAccount,
      monto,
      moneda,
    };

    setLoading(true);
    try {
      const nuevaTransaccion = await realizarTransferencia(transferData);
      Swal.fire('Éxito', 'Transferencia realizada con éxito.', 'success');

      // Limpiar formulario
      setFromAccount('');
      setToAccount('');
      setMonto('');
      setMoneda('USD');

      // Agregar la transacción al inicio del array
      setTransacciones(prev => [nuevaTransaccion, ...prev]);
    } catch (error) {
      Swal.fire('Error', 'No se pudo realizar la transferencia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cuando se cambia la cuenta de origen, obtener la info para mostrar
  useEffect(() => {
    if (fromAccount) {
      const account = userAccounts.find(acc => acc.id === fromAccount);
      setSelectedAccount(account);
    } else {
      setSelectedAccount(null);
    }
  }, [fromAccount, userAccounts]);

  return (
    <div className="container my-4">
      {/* Información visual de la cuenta de origen seleccionada */}
      <div className="mb-4">
        {selectedAccount ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Información de la Cuenta de Origen</h5>
              <p><strong>Nombre:</strong> {selectedAccount.name}</p>
              <p><strong>Número:</strong> {selectedAccount.account_number}</p>
              <p><strong>Propietario:</strong> {selectedAccount.owner}</p>
              <p><strong>Saldo:</strong> ${selectedAccount.saldo}</p>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            Selecciona una cuenta de origen para ver su información.
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
                {/* Cuenta de Origen */}
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
                    {userAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cuenta de Destino */}
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
                    {userAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.account_number} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monto */}
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

                {/* Moneda */}
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
              <div className="spinner-border" role="status"></div>
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
                    <td>{trans.from_account?.account_number}</td>
                    <td>{trans.to_account?.account_number}</td>
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
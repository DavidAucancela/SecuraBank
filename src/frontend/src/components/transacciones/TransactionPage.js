// TransactionsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { getUserAccounts, realizarTransferencia } from '../../api/TransaccionesAPI'; // Importa la nueva función
import { AuthContext } from '../../context/AuthContext';

const TransactionsPage = () => {
    const { token } = useContext(AuthContext); // Obtienes el token desde el contexto
    const [userAccounts, setUserAccounts] = useState([]); // Estado para almacenar las cuentas del usuario
    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [monto, setMonto] = useState('');
    const [moneda, setMoneda] = useState('USD');
    const [mfaCode, setMfaCode] = useState('');
    const [showMfa, setShowMfa] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Llamada a la API para obtener las cuentas del usuario
    useEffect(() => {
        const fetchUserAccounts = async () => {
            try {
                const accounts = await getUserAccounts(); // Llamamos a la función que obtiene las cuentas
                setUserAccounts(accounts); // Guardamos las cuentas en el estado
            } catch (err) {
                console.error("Error al obtener las cuentas", err);
            }
        };

        if (token) {
            fetchUserAccounts(); // Solo llamamos a la API si hay un token
        }
    }, [token]); // Solo se vuelve a ejecutar si el token cambia

    useEffect(() => {
        if (parseFloat(monto) > 500) {
            setShowMfa(true);
        } else {
            setShowMfa(false);
            setMfaCode('');
        }
    }, [monto]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validar que las cuentas no sean iguales
        if (fromAccount === toAccount) {
            setError('La cuenta de origen y destino no pueden ser iguales.');
            return;
        }

        // Preparar los datos de la transferencia
        const transferData = {
            from_account: fromAccount,
            to_account: toAccount,
            monto: monto,
            moneda: moneda,
            ubicacion: 'Online', // Puedes cambiar esto según tu lógica
        };

        // Si el monto supera 500, agregar el código MFA
        if (parseFloat(monto) > 500) {
            transferData.mfa_code = mfaCode;
        }

        try {
            // Realizar la transferencia utilizando la API
            const response = await realizarTransferencia(transferData);

            // Si la transferencia es exitosa, actualizar el estado
            setSuccess(`Transferencia realizada exitosamente. ID: ${response.transaccion_id}`);
            // Limpiar el formulario después de la transferencia exitosa
            setFromAccount('');
            setToAccount('');
            setMonto('');
            setMoneda('USD');
            setMfaCode('');
            setShowMfa(false);
        } catch (err) {
            setError(err.detail || 'Ocurrió un error al realizar la transferencia.');
        }
    };

    return (
        <div className="transaction-form">
            <h2>Realizar Transferencia</h2>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Cuenta de Origen:</label>
                    <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
                        <option value="">Seleccione una cuenta</option>
                        {userAccounts.length > 0 ? (
                            userAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.number} - Saldo: {account.balance} {account.currency}
                                </option>
                            ))
                        ) : (
                            <option disabled>No hay cuentas disponibles</option>
                        )}
                    </select>
                </div>

                <div>
                    <label>Cuenta de Destino:</label>
                    <select value={toAccount} onChange={(e) => setToAccount(e.target.value)} required>
                        <option value="">Seleccione una cuenta</option>
                        {userAccounts.length > 0 ? (
                            userAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.number} - Usuario: {account.user.username}
                                </option>
                            ))
                        ) : (
                            <option disabled>No hay cuentas disponibles</option>
                        )}
                    </select>
                </div>

                <div>
                    <label>Monto:</label>
                    <input
                        type="number"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                <div>
                    <label>Moneda:</label>
                    <select value={moneda} onChange={(e) => setMoneda(e.target.value)} required>
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
                    <div>
                        <label>Código MFA:</label>
                        <input
                            type="text"
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            required={showMfa}
                        />
                    </div>
                )}

                <button type="submit">Enviar Transferencia</button>
            </form>
        </div>
    );
};

export default TransactionsPage;

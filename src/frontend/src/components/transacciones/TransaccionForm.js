// frontend/src/components/transacciones/TransaccionForm.jsx
import React, { useState } from 'react';
import { crearTransaccion } from '../../api/TransaccionesAPI';

function TransaccionForm() {
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [monto, setMonto] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        cuenta_origen: cuentaOrigen,
        cuenta_destino: cuentaDestino,
        monto: monto,
      };
      const nuevaTx = await crearTransaccion(data);

      if (nuevaTx.estado === 'fallida') {
        alert('Transacción fallida (saldo insuficiente o error).');
      } else if (nuevaTx.estado === 'completada') {
        alert('Transacción creada con éxito.');
      }

      // Reset form
      setCuentaOrigen('');
      setCuentaDestino('');
      setMonto('');
    } catch (error) {
      console.error("Error creando transacción:", error);
      alert(error?.response?.data?.detail || "Error al crear la transacción.");
    }
  };

  return (
    <div>
      <h2>Crear Nueva Transacción</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Cuenta Origen:</label>
          <input
            type="text"
            value={cuentaOrigen}
            onChange={(e) => setCuentaOrigen(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Cuenta Destino:</label>
          <input
            type="text"
            value={cuentaDestino}
            onChange={(e) => setCuentaDestino(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Monto:</label>
          <input
            type="number"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>
        <button type="submit">Crear</button>
      </form>
    </div>
  );
}

export default TransaccionForm;

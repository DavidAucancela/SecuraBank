// src/components/transacciones/TransaccionesList.js
import React, { useState, useEffect } from 'react';
import { fetchTransacciones, revertirTransaccion } from '../../api/TransaccionesAPI';

function TransaccionesList() {
  const [transacciones, setTransacciones] = useState([]);

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const cargarTransacciones = async () => {
    try {
      const data = await fetchTransacciones(); // sin cuenta_id
      setTransacciones(data);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    }
  };

  const handleRevertir = async (id) => {
    try {
      const resultado = await revertirTransaccion(id);
      alert(`Transacción revertida. Estado actual: ${resultado.estado}`);
      cargarTransacciones();
    } catch (error) {
      console.error("Error al revertir:", error);
      alert(error?.response?.data?.detail || "No se pudo revertir la transacción.");
    }
  };

  return (
    <div>
      <h2>Historial de Transacciones</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transacciones.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.cuenta_origen.account_number}</td>
              <td>{tx.cuenta_destino.account_number}</td>
              <td>{tx.monto}</td>
              <td>{tx.estado}</td>
              <td>
                {tx.estado === 'completada' && (
                  <button onClick={() => handleRevertir(tx.id)}>
                    Revertir
                  </button>
                )}
                {/* Otras acciones */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransaccionesList;

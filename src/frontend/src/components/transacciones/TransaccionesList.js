// frontend/src/components/transacciones/TransaccionesList.jsx
import React, { useState, useEffect } from 'react';
import { fetchTransacciones, revertirTransaccion } from '../../api/TransaccionesAPI';

function TransaccionesList() {
  const [transacciones, setTransacciones] = useState([]);

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const cargarTransacciones = async () => {
    try {
      const data = await fetchTransacciones();
      setTransacciones(data);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    }
  };

  const handleRevertir = async (id) => {
    try {
      const resultado = await revertirTransaccion(id);
      alert(`Transacción revertida. Estado: ${resultado.estado}`);
      // Recargar la lista
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
              <td>{tx.cuenta_origen}</td>
              <td>{tx.cuenta_destino}</td>
              <td>{tx.monto}</td>
              <td>{tx.estado}</td>
              <td>
                {tx.estado === 'completada' && (
                  <button onClick={() => handleRevertir(tx.id)}>
                    Revertir
                  </button>
                )}
                {/* Si quieres más acciones, agrégalas aquí */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TransaccionesList;

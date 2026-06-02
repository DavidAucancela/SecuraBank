import React, { useEffect, useState, useContext } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getDashboard } from '../../api/DashboardAPI';
import { AuthContext } from '../../context/AuthContext';

const StatCard = ({ title, value, subtitle, color }) => (
  <div className="col-md-4 mb-3">
    <div className={`card border-0 shadow-sm h-100`} style={{ borderLeft: `4px solid ${color}` }}>
      <div className="card-body">
        <p className="text-muted mb-1" style={{ fontSize: '0.85rem' }}>{title}</p>
        <h2 className="fw-bold mb-0" style={{ color }}>{value}</h2>
        {subtitle && <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{subtitle}</p>}
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError('No se pudo cargar el dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const { resumen, transacciones_por_dia, cuentas } = data;

  // Formatear fechas del eje X a dd/mm
  const chartData = transacciones_por_dia.map(d => ({
    ...d,
    label: d.fecha.slice(5).replace('-', '/'),
  }));

  return (
    <div>
      <h3 className="mb-4 fw-semibold">
        Resumen financiero
        {user?.username && <span className="text-muted fw-normal fs-6 ms-2">— {user.username}</span>}
      </h3>

      {/* Tarjetas de resumen */}
      <div className="row mb-4">
        <StatCard
          title="Saldo total"
          value={`$${resumen.total_saldo.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          subtitle="Suma de todas tus cuentas"
          color="#006666"
        />
        <StatCard
          title="Cuentas activas"
          value={resumen.num_cuentas}
          subtitle="Cuentas registradas"
          color="#20B2AA"
        />
        <StatCard
          title="Transferencias totales"
          value={resumen.num_transacciones}
          subtitle="Historial completo"
          color="#0d6efd"
        />
      </div>

      {/* Gráfica de actividad */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Actividad últimos 7 días</h5>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="enviadas" name="Enviadas" fill="#006666" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recibidas" name="Recibidas" fill="#20B2AA" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de cuentas */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">Mis cuentas</h5>
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Nombre</th>
                <th>Número</th>
                <th className="text-end">Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted">Sin cuentas registradas</td>
                </tr>
              ) : (
                cuentas.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td><code>{c.account_number}</code></td>
                    <td className="text-end fw-semibold">${parseFloat(c.saldo).toFixed(2)}</td>
                    <td>
                      <span className={`badge bg-${c.estado === 'activa' ? 'success' : 'secondary'}`}>
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

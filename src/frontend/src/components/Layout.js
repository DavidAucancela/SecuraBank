import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav
        className="navbar navbar-expand-lg"
        style={{ background: 'linear-gradient(90deg, #006666 0%, #20B2AA 100%)' }}
      >
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center text-white fw-bold" to="/dashboard">
            <i className="bi bi-shield-lock-fill me-2" style={{ fontSize: '1.2rem' }} />
            SecuraBank
          </Link>

          <button
            className="navbar-toggler navbar-dark"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-controls="navbarMain"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav ms-auto d-flex align-items-center">
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link text-white">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/cuentas" className="nav-link text-white">Cuentas</Link>
              </li>
              <li className="nav-item">
                <Link to="/transacciones" className="nav-link text-white">Transacciones</Link>
              </li>
              <li className="nav-item">
                <Link to="/configuracion" className="nav-link text-white">Configuración</Link>
              </li>
              <li className="nav-item ms-2">
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-light btn-sm"
                >
                  Salir
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container my-4 flex-grow-1">
        {user && (
          <div className="mb-3">
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              Bienvenido, <strong>{user.username || 'Usuario'}</strong>
            </span>
          </div>
        )}
        <div className="card shadow-sm">
          <div className="card-body">{children}</div>
        </div>
      </div>

      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <p className="m-0 small">
            &copy; {new Date().getFullYear()} SecuraBank — Sistema seguro bajo normas OWASP
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

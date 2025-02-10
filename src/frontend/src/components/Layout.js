import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Componente Layout con barra de navegación superior, tarjeta de contenido y footer.
 * Recibe `user` (información del usuario logueado) y `children` (el contenido de cada página).
 */
const Layout = ({ children }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Función para manejar el logout
  const handleLogout = () => {
    // Elimina tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    logoutUser(); // Limpia el estado global del usuario aquí.
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* NavBar con fondo degradado */}
      <nav
        className="navbar navbar-expand-lg"
        style={{ background: 'linear-gradient(90deg, #006666 0%, #20B2AA 100%)' }}
      >
        <div className="container-fluid">
          {/* LOGO / nombre con ícono (opcional) */}
          <Link className="navbar-brand d-flex align-items-center text-white fw-bold" to="/cuentas">
            {/* Si deseas un ícono de Bootstrap Icons, usa la clase que prefieras */}
            <i className="bi bi-shield-lock-fill me-2" style={{ fontSize: '1.2rem' }}></i>
            SecuraBank
          </Link>

          {/* Botón para colapsar la barra en pantallas pequeñas (Bootstrap) */}
          <button
            className="navbar-toggler navbar-dark"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Sección colapsable con las opciones de navegación */}
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto d-flex align-items-center">
              <li className="nav-item">
                <Link to="/cuentas" className="nav-link text-white">
                  Cuentas
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/transacciones" className="nav-link text-white">
                  Transacciones
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/configuracion" className="nav-link text-white">
                  Configuración
                </Link>
              </li>
              <li className="nav-item">
                <button
                  onClick={handleLogout}
                  className="nav-link btn btn-link text-white text-decoration-none"
                >
                  Salir
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Contenedor principal */}
      <div className="container my-4 flex-grow-1">
        {user && (
          <div className="mb-4">
            <h4 className="fw-semibold">Bienvenido, {user.username || 'Usuario'}</h4>
          </div>
        )}

        {/* Tarjeta que envuelve el contenido */}
        <div className="card shadow-sm">
          <div className="card-body">{children}</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <p className="m-0">
            &copy; {new Date().getFullYear()} SecuraBank. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

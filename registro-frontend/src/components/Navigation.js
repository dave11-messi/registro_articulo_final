import React from 'react';
import { Link } from 'react-router-dom';

function Navigation({ user, onLogout }) {
  // Solo mostrar si hay un usuario logueado
  if (!user) return null; 

  return (
    <nav className="main-nav">
      <ul>
        <li>
          {/* Enlace al Panel de Solicitudes (para ver el historial y crear nuevas) */}
          <Link to="/solicitudes">Panel de Solicitudes</Link>
        </li>
        
        {/* Enlace al Panel de Revisor: Solo se muestra si el usuario tiene el flag is_staff: True */}
        {user.is_staff && (
          <li>
            <Link to="/revisor">Panel de Revisor</Link>
          </li>
        )}

        {/* Botón de cierre de sesión */}
        <li>
          <button onClick={onLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
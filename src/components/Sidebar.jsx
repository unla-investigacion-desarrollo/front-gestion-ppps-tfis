import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Sidebar.css';

const Sidebar = () => {
  const user = useSelector((state) => state.auth.user);
  const roles = Array.isArray(user?.roles) ? user.roles : (user?.roles ? [user.roles] : []);
  const isStudent = roles.includes('ESTUDIANTE');
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li><Link to="/dashboard">Inicio</Link></li>
          {isStudent && <li><Link to="/carga-propuesta">Cargar Propuesta</Link></li>}
          <li><Link to="/carga-proyecto">Cargar Proyecto</Link></li>
          <li><Link to="#">Consultar Estado</Link></li>
          <li><Link to="#">Subir Entregas</Link></li>
          <li><Link to="#">Observaciones</Link></li>
          <li><Link to="#">Resoluciones</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

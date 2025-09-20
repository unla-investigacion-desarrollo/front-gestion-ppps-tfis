import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li><Link to="/dashboard">Inicio</Link></li>
          <li><Link to="/carga-propuesta">Cargar Propuesta</Link></li>
          <li><Link to="/carga-proyecto">Cargar Proyecto</Link></li>
          <li><Link to="/carga-trabajo">Cargar Trabajo</Link></li>
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

import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li><a href="/dashboard">Inicio</a></li>
          <li><a href="/carga-propuesta">Cargar Propuesta</a></li>
          <li><a href="/carga-proyecto">Cargar Proyecto</a></li>
          <li><a href="/carga-trabajo">Cargar Trabajo</a></li>
          <li><a href="#">Consultar Estado</a></li>
          <li><a href="#">Subir Entregas</a></li>
          <li><a href="#">Observaciones</a></li>
          <li><a href="#">Resoluciones</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

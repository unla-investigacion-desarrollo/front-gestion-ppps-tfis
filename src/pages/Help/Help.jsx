import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/unla.css';
import bgImage from '../../assets/fondo-rojo.jpg';

const Help = () => {
  return (
    <div
      className="unla-page"
      style={{
        display: 'grid',
        placeItems: 'center',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '16px'
      }}
    >
      <div className="unla-card" style={{ width: '100%', maxWidth: 680 }}>
        <h1>Ayuda y Recuperación de Contraseña</h1>
        <p>
          Si ya te registraste y no podés ingresar, es posible que tu cuenta esté pendiente de aprobación o que necesites
          restablecer tu contraseña.
        </p>
        <h2 className="unla-section-title">Estudiantes</h2>
        <ul>
          <li>El registro queda en estado <strong>pendiente</strong> hasta que un administrador lo apruebe.</li>
          <li>Una vez aprobado, tu contraseña por defecto será <strong>DNI + tu número de DNI</strong> (por ejemplo, <code>DNI12345678</code>).</li>
          <li>Si no recordás tu contraseña o cambió, pedile al administrador que la reinicie. Se restablecerá nuevamente a <strong>DNI + DNI</strong>.</li>
        </ul>

        <h2 className="unla-section-title">Docentes</h2>
        <ul>
          <li>Podés ser invitado por email o creado directamente por un administrador.</li>
          <li>Si fuiste creado directamente, tu contraseña inicial fue definida por el administrador.</li>
          <li>Si no recordás tu contraseña, solicitá al administrador el <strong>reseteo</strong>.</li>
        </ul>

        <h2 className="unla-section-title">¿Necesitás ayuda?</h2>
        <p>
          Contactá al administrador para que <strong>apruebe</strong> tu cuenta o <strong>reseteé</strong> tu contraseña. Si ya estás listo para
          iniciar sesión, volvé al <Link to="/login">Inicio de sesión</Link>.
        </p>
      </div>
    </div>
  );
};

export default Help;

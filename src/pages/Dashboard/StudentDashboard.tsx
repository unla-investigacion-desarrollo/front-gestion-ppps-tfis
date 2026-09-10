import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ConfirmLogoutModal from '../../components/ConfirmLogoutModal';
import './StudentDashboard.css';

export interface StudentDashboardProps {
  user?: any;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const user = useMemo(() => {
    if (propUser) return propUser;
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, [propUser]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Nombre para el saludo "Hola, María 👋"
  const studentFirstName = useMemo(() => {
    let name = '';
    if (user?.nombre) name = user.nombre;
    else if (user?.firstName) name = user.firstName;
    else if (user?.name) name = user.name.split(' ')[0];
    else if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      name = emailPrefix.split('.')[0];
    }
    if (!name) return 'Estudiante';
    const trimmed = name.trim();
    if (trimmed.toLowerCase() === 'maria') return 'María';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }, [user]);

  // Estado de secciones desplegables del sidebar (fiel a la vista del Mockup)
  const [openSections, setOpenSections] = useState<{ [k: string]: boolean }>({
    proyectos: true,
    entregas: true,
    convocatorias: true,
    tramites: true,
    perfil: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="student-dashboard-layout">
      {/* =========================================================================
          SIDEBAR LATERAL IZQUIERDO (FONDO BORDO INSTITUCIONAL UNLa)
          ========================================================================= */}
      <aside className="student-sidebar">
        <nav className="student-sidebar-menu">
          {/* Item 1: Inicio (Activo) */}
          <div className="student-sidebar-group">
            <button
              type="button"
              className="student-sidebar-header-btn active"
              onClick={() => navigate('/dashboard')}
            >
              <div className="student-sidebar-header-left">
                <span className="student-sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
                  </svg>
                </span>
                <span>Inicio</span>
              </div>
            </button>
          </div>

          {/* Item 2: Proyectos TFI */}
          <div className="student-sidebar-group">
            <button
              type="button"
              className="student-sidebar-header-btn"
              onClick={() => toggleSection('proyectos')}
            >
              <div className="student-sidebar-header-left">
                <span className="student-sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                    <path d="M4.5 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </span>
                <span>Proyectos TFI</span>
              </div>
              <span className={`student-sidebar-chevron ${openSections.proyectos ? 'rotated' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </span>
            </button>

            {openSections.proyectos && (
              <ul className="student-sidebar-sublist">
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/mis-proyectos')}
                  >
                    Ver proyectos disponibles
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/mis-proyectos?tab=requests')}
                  >
                    Mis solicitudes
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/mis-proyectos?tab=active')}
                  >
                    Mis proyectos activos
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Item 3: Entregas TFI */}
          <div className="student-sidebar-group">
            <button
              type="button"
              className="student-sidebar-header-btn"
              onClick={() => toggleSection('entregas')}
            >
              <div className="student-sidebar-header-left">
                <span className="student-sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z" />
                    <path d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z" />
                  </svg>
                </span>
                <span>Entregas TFI</span>
              </div>
              <span className={`student-sidebar-chevron ${openSections.entregas ? 'rotated' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </span>
            </button>

            {openSections.entregas && (
              <ul className="student-sidebar-sublist">
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/entregas')}
                  >
                    Ver/subir entrega
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/entregas')}
                  >
                    Consultar observaciones, tutoría y calificación
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Item 4: Convocatorias PPP */}
          <div className="student-sidebar-group">
            <button
              type="button"
              className="student-sidebar-header-btn"
              onClick={() => toggleSection('convocatorias')}
            >
              <div className="student-sidebar-header-left">
                <span className="student-sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1l-.548-.082a1 1 0 0 1-.837-1.135l.93-6.222C3.12 7.732 1.34 8.793.543 9.403A.5.5 0 0 1 0 9.006V4.994a.5.5 0 0 1 .543-.397c.797.61 2.577 1.671 4.512 1.732l-.93-6.222A1 1 0 0 1 4.962.972l.548-.082a1 1 0 0 1 1.135.837l.405 2.712c2.422-.24 4.75-.842 6.912-2.083V2.5zm1 0a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0V2.5z" />
                  </svg>
                </span>
                <span>Convocatorias PPP</span>
              </div>
              <span className={`student-sidebar-chevron ${openSections.convocatorias ? 'rotated' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </span>
            </button>

            {openSections.convocatorias && (
              <ul className="student-sidebar-sublist">
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/ppp/convocatorias')}
                  >
                    Ver convocatorias abiertas
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/ppp/convocatorias')}
                  >
                    Postularse a una convocatoria
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/ppp/convocatorias')}
                  >
                    Iniciar trámite de PPP externa
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Item 5: Mis trámites PPP */}
          <div className="student-sidebar-group">
            <button
              type="button"
              className="student-sidebar-header-btn"
              onClick={() => toggleSection('tramites')}
            >
              <div className="student-sidebar-header-left">
                <span className="student-sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                    <path d="M4.5 10.5A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 7h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                  </svg>
                </span>
                <span>Mis trámites PPP</span>
              </div>
              <span className={`student-sidebar-chevron ${openSections.tramites ? 'rotated' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </span>
            </button>

            {openSections.tramites && (
              <ul className="student-sidebar-sublist">
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/ppp')}
                  >
                    Ver estado de la postulación o trámite
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/ppp')}
                  >
                    Notificar documentación enviada
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/alumno/ppp')}
                  >
                    Abandonar trámite cuando corresponda
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Item 6: Mi perfil */}
          <div className="student-sidebar-group">
            <button
              type="button"
              className="student-sidebar-header-btn"
              onClick={() => toggleSection('perfil')}
            >
              <div className="student-sidebar-header-left">
                <span className="student-sidebar-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                  </svg>
                </span>
                <span>Mi perfil</span>
              </div>
              <span className={`student-sidebar-chevron ${openSections.perfil ? 'rotated' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </span>
            </button>

            {openSections.perfil && (
              <ul className="student-sidebar-sublist">
                <li>
                  <a
                    className="student-sidebar-sublink"
                    onClick={() => navigate('/change-password')}
                  >
                    Cambiar contraseña
                  </a>
                </li>
                <li>
                  <a
                    className="student-sidebar-sublink text-danger-emphasis"
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    Cerrar sesión
                  </a>
                </li>
              </ul>
            )}
          </div>
        </nav>
      </aside>

      {/* =========================================================================
          ÁREA PRINCIPAL DE CONTENIDO (FONDO CLARO, SALUDO Y 6 TARJETAS)
          ========================================================================= */}
      <main className="student-main-content">
        <div className="studencontainert-content-">
          {/* Sección de Bienvenida */}
          <div className="student-greeting-section">
            <div className="student-greeting-pretitle">BIENVENIDO/A</div>
            <h1 className="student-greeting-title">
              Hola, {studentFirstName} 👋
            </h1>
            <p className="student-greeting-subtitle">
              Desde aquí podés gestionar tus proyectos, entregas y trámites académicos.
            </p>
          </div>

          {/* Grilla de 6 Tarjetas (2 filas x 3 columnas) */}
          <div className="student-cards-grid">
            {/* Tarjeta 1: Proyectos TFI */}
            <div
              className="student-feature-card"
              onClick={() => navigate('/alumno/mis-proyectos')}
              role="button"
              tabIndex={0}
            >
              <div className="student-card-icon-badge purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                  <path d="M4.5 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z" />
                </svg>
              </div>
              <h3 className="student-card-title">Proyectos TFI</h3>
              <p className="student-card-desc">
                Consultá los proyectos disponibles, revisá tus solicitudes y accedé a tus proyectos activos.
              </p>
              <div className="student-card-arrow">→</div>
            </div>

            {/* Tarjeta 2: Entregas TFI */}
            <div
              className="student-feature-card"
              onClick={() => navigate('/alumno/entregas')}
              role="button"
              tabIndex={0}
            >
              <div className="student-card-icon-badge blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z" />
                  <path d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z" />
                </svg>
              </div>
              <h3 className="student-card-title">Entregas TFI</h3>
              <p className="student-card-desc">
                Subí tus entregas y consultá observaciones, tutoría y calificación.
              </p>
              <div className="student-card-arrow">→</div>
            </div>

            {/* Tarjeta 3: Convocatorias PPP */}
            <div
              className="student-feature-card"
              onClick={() => navigate('/ppp/convocatorias')}
              role="button"
              tabIndex={0}
            >
              <div className="student-card-icon-badge green">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13 2.5a1.5 1.5 0 0 1 3 0v11a1.5 1.5 0 0 1-3 0v-.214c-2.162-1.241-4.49-1.843-6.912-2.083l.405 2.712A1 1 0 0 1 5.51 15.1l-.548-.082a1 1 0 0 1-.837-1.135l.93-6.222C3.12 7.732 1.34 8.793.543 9.403A.5.5 0 0 1 0 9.006V4.994a.5.5 0 0 1 .543-.397c.797.61 2.577 1.671 4.512 1.732l-.93-6.222A1 1 0 0 1 4.962.972l.548-.082a1 1 0 0 1 1.135.837l.405 2.712c2.422-.24 4.75-.842 6.912-2.083V2.5zm1 0a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0V2.5z" />
                </svg>
              </div>
              <h3 className="student-card-title">Convocatorias PPP</h3>
              <p className="student-card-desc">
                Revisá las convocatorias abiertas, postulate y gestioná tus trámites PPP.
              </p>
              <div className="student-card-arrow">→</div>
            </div>

            {/* Tarjeta 4: Mis trámites PPP */}
            <div
              className="student-feature-card"
              onClick={() => navigate('/alumno/ppp')}
              role="button"
              tabIndex={0}
            >
              <div className="student-card-icon-badge pink">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                  <path d="M4.5 10.5A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 7h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 4h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                </svg>
              </div>
              <h3 className="student-card-title">Mis trámites PPP</h3>
              <p className="student-card-desc">
                Seguimiento de tu postulación o trámite, notificación de documentación y abandono cuando corresponda.
              </p>
              <div className="student-card-arrow">→</div>
            </div>

            {/* Tarjeta 5: Mi perfil */}
            <div
              className="student-feature-card"
              onClick={() => navigate('/change-password')}
              role="button"
              tabIndex={0}
            >
              <div className="student-card-icon-badge amber">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                </svg>
              </div>
              <h3 className="student-card-title">Mi perfil</h3>
              <p className="student-card-desc">
                Actualizá tus datos y configuraciones de cuenta.
              </p>
              <div className="student-card-arrow">→</div>
            </div>

            {/* Tarjeta 6: Banner Promocional "Tu futuro académico" con ilustración */}
            <div className="student-future-card">
              <div className="student-future-content">
                <h3 className="student-future-title">
                  Tu futuro académico también es parte de tu proyecto
                </h3>
                <p className="student-future-desc">
                  Estamos para acompañarte en cada paso.
                </p>
              </div>

              <div className="student-future-illustration" aria-hidden="true">
                <svg
                  width="110"
                  height="95"
                  viewBox="0 0 100 90"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Destellos / estrellitas */}
                  <path
                    d="M84 10L86 4L88 10L94 12L88 14L86 20L84 14L78 12L84 10Z"
                    fill="#3b82f6"
                    opacity="0.75"
                  />
                  <circle cx="95" cy="24" r="1.5" fill="#3b82f6" opacity="0.6" />
                  <circle cx="76" cy="2" r="1" fill="#3b82f6" opacity="0.5" />

                  {/* Birrete de graduación (Mortarboard) */}
                  <path
                    d="M50 18L18 30L50 42L82 30L50 18Z"
                    fill="#1e40af"
                    stroke="#1e3a8a"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Casquete del birrete */}
                  <path
                    d="M30 35V46C30 46 39 53 50 53C61 53 70 46 70 46V35"
                    stroke="#1e3a8a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Borla y cordón */}
                  <path
                    d="M75 32V44L77 46H73L75 44"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="75" cy="32" r="2.5" fill="#3b82f6" />

                  {/* Libro superior */}
                  <rect
                    x="16"
                    y="57"
                    width="64"
                    height="12"
                    rx="3"
                    fill="#ffffff"
                    stroke="#1e3a8a"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="24"
                    y1="57"
                    x2="24"
                    y2="69"
                    stroke="#1e3a8a"
                    strokeWidth="2"
                  />

                  {/* Libro inferior */}
                  <rect
                    x="12"
                    y="69"
                    width="72"
                    height="13"
                    rx="3"
                    fill="#ffffff"
                    stroke="#1e3a8a"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="21"
                    y1="69"
                    x2="21"
                    y2="82"
                    stroke="#1e3a8a"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmación para cerrar sesión */}
      <ConfirmLogoutModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          localStorage.removeItem('user');
          setShowLogoutConfirm(false);
          navigate('/');
        }}
      />
    </div>
  );
};

export default StudentDashboard;

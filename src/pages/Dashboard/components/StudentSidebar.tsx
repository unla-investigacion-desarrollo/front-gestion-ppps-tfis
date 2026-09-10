import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface StudentSidebarProps {
  onShowLogoutConfirm: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ onShowLogoutConfirm }) => {
  const navigate = useNavigate();

  // Estado de secciones desplegables del sidebar
  const [openSections, setOpenSections] = useState<{ [sectionKey: string]: boolean }>({
    proyectos: true,
    entregas: true,
    convocatorias: true,
    tramites: true,
    perfil: false,
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prevSections) => ({
      ...prevSections,
      [sectionKey]: !prevSections[sectionKey],
    }));
  };

  return (
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
                  onClick={onShowLogoutConfirm}
                >
                  Cerrar sesión
                </a>
              </li>
            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default StudentSidebar;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../../../assets/logo.png';

export type TeacherRoleProfile = 'evaluador' | 'tutor';
export type EvaluatorView = 'inicio' | 'ppp';
export type TutorView = 'inicio' | 'proyectos';

interface TeacherSidebarProps {
  roleProfile: TeacherRoleProfile;
  activeView: string;
  onSelectView: (view: string) => void;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  roleProfile,
  activeView,
  onSelectView,
}) => {
  const navigate = useNavigate();

  // Secciones desplegables en menú Evaluador
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    ppp: true,
    proyectos: true,
    entregas: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="teacher-sidebar">
      {/* Brand Header */}
      <div className="teacher-sidebar-brand">
        <img src={logo} alt="UNLa" className="teacher-sidebar-logo" />
        <div className="teacher-sidebar-title-wrap">
          <span className="teacher-sidebar-title">Gestión de TFI</span>
          {roleProfile === 'evaluador' && (
            <span className="teacher-sidebar-subtitle">Campus Académico</span>
          )}
        </div>
      </div>

      {/* Navegación del Sidebar */}
      <nav className="teacher-sidebar-nav">
        {/* Item Común: Inicio */}
        <button
          type="button"
          className={`teacher-sidebar-item ${activeView === 'inicio' ? 'active' : ''}`}
          onClick={() => onSelectView('inicio')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
          </svg>
          <span>Inicio</span>
        </button>

        {/* =================================================================
            MENÚ PARA PROFESOR EVALUADOR (Mockup 1 y 2)
            ================================================================= */}
        {roleProfile === 'evaluador' && (
          <>
            {/* Gestión de PPP */}
            <div>
              <button
                type="button"
                className="teacher-sidebar-item justify-content-between"
                onClick={() => toggleSection('ppp')}
              >
                <div className="d-flex align-items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  </svg>
                  <span>Gestión de PPP</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  style={{
                    transform: openSections.ppp ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>

              {openSections.ppp && (
                <ul className="teacher-sidebar-sublist">
                  <li>
                    <button
                      type="button"
                      className={`teacher-sidebar-subitem ${activeView === 'ppp' ? 'active' : ''}`}
                      onClick={() => onSelectView('ppp')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                      </svg>
                      <span>PPP</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="teacher-sidebar-subitem"
                      onClick={() => navigate('/admin/proposals')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 0h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm0 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z" />
                        <path d="M4.5 10.5A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 7h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                      </svg>
                      <span>Propuestas y postulantes</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Proyectos */}
            <div>
              <button
                type="button"
                className="teacher-sidebar-item justify-content-between"
                onClick={() => toggleSection('proyectos')}
              >
                <div className="d-flex align-items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19z" />
                  </svg>
                  <span>Proyectos</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  style={{
                    transform: openSections.proyectos ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>

              {openSections.proyectos && (
                <ul className="teacher-sidebar-sublist">
                  <li>
                    <button
                      type="button"
                      className="teacher-sidebar-subitem"
                      onClick={() => navigate('/docente/proyectos')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9zM1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 9.5 2h-8z" />
                      </svg>
                      <span>Proyectos</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Entregas y calificaciones */}
            <div>
              <button
                type="button"
                className="teacher-sidebar-item justify-content-between"
                onClick={() => toggleSection('entregas')}
              >
                <div className="d-flex align-items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                    <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z" />
                  </svg>
                  <span>Entregas y calificaciones</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  style={{
                    transform: openSections.entregas ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>

              {openSections.entregas && (
                <ul className="teacher-sidebar-sublist">
                  <li>
                    <button
                      type="button"
                      className="teacher-sidebar-subitem"
                      onClick={() => navigate('/docente/entregas')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                      </svg>
                      <span>Entregas y calificaciones</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="teacher-sidebar-subitem"
                      onClick={() => navigate('/docente/entregas')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                      </svg>
                      <span>Calificaciones</span>
                    </button>
                  </li>
                </ul>
              )}
            </div>

            <div className="teacher-sidebar-divider" />

            {/* Configuración del Drive */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('toast', { detail: { message: 'Configuración del Drive sincronizada correctamente', type: 'info' } })
                );
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
              </svg>
              <span>Configuración del Drive</span>
            </button>

            {/* Mi perfil */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => navigate('/change-password')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
              </svg>
              <span>Mi perfil</span>
            </button>
          </>
        )}

        {/* =================================================================
            MENÚ PARA PROFESOR TUTOR (Mockup 3 y 4)
            ================================================================= */}
        {roleProfile === 'tutor' && (
          <>
            {/* Mis proyectos */}
            <button
              type="button"
              className={`teacher-sidebar-item ${activeView === 'proyectos' ? 'active' : ''}`}
              onClick={() => onSelectView('proyectos')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19z" />
              </svg>
              <span>Mis proyectos</span>
            </button>

            {/* Solicitudes */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => navigate('/admin/approvals')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
                <path d="M4.5 10.5A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-3A.5.5 0 0 1 5 7h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
              </svg>
              <span>Solicitudes</span>
            </button>

            {/* Tutorías pendientes */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => onSelectView('inicio')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              </svg>
              <span>Tutorías pendientes</span>
            </button>

            <div className="teacher-sidebar-divider" />

            {/* Mi perfil */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => navigate('/change-password')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
              </svg>
              <span>Mi perfil</span>
            </button>
          </>
        )}
      </nav>

      {/* =================================================================
          TARJETA INFERIOR: IDENTIFICADOR DE ROL
          ================================================================= */}
      <div className="teacher-sidebar-footer">
        <div className="teacher-role-badge-card">
          <div className="teacher-role-avatar-circle">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917l-7.5-3.5ZM8 8.46 1.758 5.965 8 3.052l6.242 2.913L8 8.46Z" />
              <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.566 4.176 9.032Z" />
            </svg>
          </div>
          <div className="teacher-role-info">
            <div className="teacher-role-title">
              {roleProfile === 'evaluador' ? 'Profesor evaluador' : 'Profesor tutor'}
            </div>
            <div className="teacher-role-subtitle">
              {roleProfile === 'evaluador' ? 'Evaluación y seguimiento' : 'Acompañamiento y seguimiento'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

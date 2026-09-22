import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../../assets/Campus-Virtual-UNLa.png';

// Iconos de FontAwesome vía react-icons
import {
  FaHouse,
  FaGraduationCap,
  FaChevronDown,
  FaFileLines,
  FaClipboardList,
  FaFolder,
  FaCalendarCheck,
  FaStar,
  FaGear,
  FaUser,
  FaBullhorn,
  FaUserClock,
  FaChalkboardUser,
} from 'react-icons/fa6';

export type TeacherRoleProfile = 'evaluador' | 'tutor';
export type EvaluatorView = 'inicio' | 'ppp';
export type TutorView = 'inicio' | 'proyectos' | 'convocatoria-tfi' | 'solicitudes';

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
  const location = useLocation();

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
          onClick={() => {
            onSelectView('inicio');
            if (location.pathname !== '/dashboard') {
              navigate('/dashboard');
            }
          }}
        >
          <FaHouse size={16} />
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
                  <FaGraduationCap size={16} />
                  <span>Gestión de PPP</span>
                </div>
                <FaChevronDown
                  size={12}
                  style={{
                    transform: openSections.ppp ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>

              {openSections.ppp && (
                <ul className="teacher-sidebar-sublist">
                  <li>
                    <button
                      type="button"
                      className={`teacher-sidebar-subitem ${activeView === 'ppp' ? 'active' : ''}`}
                      onClick={() => {
                        onSelectView('ppp');
                        if (location.pathname !== '/dashboard') {
                          navigate('/dashboard', { state: { initialView: 'ppp' } });
                        }
                      }}
                    >
                      <FaFileLines size={14} />
                      <span>PPP</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={`teacher-sidebar-subitem ${activeView === 'propuestas' ? 'active' : ''}`}
                      onClick={() => {
                        onSelectView('propuestas');
                        if (location.pathname !== '/admin/proposals') {
                          navigate('/admin/proposals');
                        }
                      }}
                    >
                      <FaClipboardList size={14} />
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
                  <FaFolder size={16} />
                  <span>Proyectos</span>
                </div>
                <FaChevronDown
                  size={12}
                  style={{
                    transform: openSections.proyectos ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>

              {openSections.proyectos && (
                <ul className="teacher-sidebar-sublist">
                  <li>
                    <button
                      type="button"
                      className={`teacher-sidebar-subitem ${activeView === 'convocatoria-tfi' || activeView === 'proyectos' ? 'active' : ''}`}
                      onClick={() => {
                        onSelectView('convocatoria-tfi');
                        if (location.pathname !== '/docente/proyectos') {
                          navigate('/docente/proyectos');
                        }
                      }}
                    >
                      <FaFolder size={14} />
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
                  <FaCalendarCheck size={16} />
                  <span>Entregas y calificaciones</span>
                </div>
                <FaChevronDown
                  size={12}
                  style={{
                    transform: openSections.entregas ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                />
              </button>

              {openSections.entregas && (
                <ul className="teacher-sidebar-sublist">
                  <li>
                    <button
                      type="button"
                      className="teacher-sidebar-subitem"
                      onClick={() => navigate('/docente/entregas')}
                    >
                      <FaCalendarCheck size={14} />
                      <span>Entregas y calificaciones</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="teacher-sidebar-subitem"
                      onClick={() => navigate('/docente/entregas')}
                    >
                      <FaStar size={14} />
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
              <FaGear size={16} />
              <span>Configuración del Drive</span>
            </button>

            {/* Mi perfil */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => navigate('/change-password')}
            >
              <FaUser size={16} />
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
              onClick={() => {
                onSelectView('proyectos');
                if (location.pathname !== '/dashboard') {
                  navigate('/dashboard', { state: { initialView: 'proyectos' } });
                }
              }}
            >
              <FaFolder size={16} />
              <span>Mis proyectos</span>
            </button>

            {/* Convocatoria proyectos TFI */}
            <button
              type="button"
              className={`teacher-sidebar-item ${activeView === 'convocatoria-tfi' ? 'active' : ''}`}
              onClick={() => {
                onSelectView('convocatoria-tfi');
                if (location.pathname !== '/docente/proyectos') {
                  navigate('/docente/proyectos');
                }
              }}
            >
              <FaBullhorn size={16} />
              <span>Convocatoria proyectos TFI</span>
            </button>

            {/* Solicitudes */}
            <button
              type="button"
              className={`teacher-sidebar-item ${activeView === 'solicitudes' ? 'active' : ''}`}
              onClick={() => {
                onSelectView('solicitudes');
                if (location.pathname !== '/admin/approvals') {
                  navigate('/admin/approvals');
                }
              }}
            >
              <FaUserClock size={16} />
              <span>Solicitudes</span>
            </button>

            {/* Tutorías pendientes */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => {
                onSelectView('inicio');
                if (location.pathname !== '/dashboard') {
                  navigate('/dashboard');
                }
              }}
            >
              <FaChalkboardUser size={16} />
              <span>Tutorías pendientes</span>
            </button>

            <div className="teacher-sidebar-divider" />

            {/* Mi perfil */}
            <button
              type="button"
              className="teacher-sidebar-item"
              onClick={() => navigate('/change-password')}
            >
              <FaUser size={16} />
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
            <FaGraduationCap size={18} />
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

export default TeacherSidebar;

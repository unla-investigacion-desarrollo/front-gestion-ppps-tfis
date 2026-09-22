import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHouse,
  FaFileLines,
  FaCloudArrowUp,
  FaBullhorn,
  FaClipboardList,
  FaUser,
  FaChevronDown,
} from 'react-icons/fa6';

export interface StudentSidebarProps {
  onShowLogoutConfirm: () => void;
  activeView?: 'inicio' | 'proyectos';
  onSelectView?: (view: 'inicio' | 'proyectos') => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  onShowLogoutConfirm,
  activeView = 'inicio',
  onSelectView,
}) => {
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
        {/* Item 1: Inicio */}
        <div className="student-sidebar-group">
          <button
            type="button"
            className={`student-sidebar-header-btn ${activeView === 'inicio' ? 'active' : ''}`}
            onClick={() => {
              if (onSelectView) {
                onSelectView('inicio');
              } else {
                navigate('/dashboard');
              }
            }}
          >
            <div className="student-sidebar-header-left">
              <span className="student-sidebar-icon">
                <FaHouse size={16} />
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
                <FaFileLines size={16} />
              </span>
              <span>Proyectos TFI</span>
            </div>
            <span className={`student-sidebar-chevron ${openSections.proyectos ? 'rotated' : ''}`}>
              <FaChevronDown size={12} />
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
                  className={`student-sidebar-sublink ${activeView === 'proyectos' ? 'active' : ''}`}
                  onClick={() => {
                    if (onSelectView) {
                      onSelectView('proyectos');
                    } else {
                      navigate('/dashboard', { state: { initialView: 'proyectos' } });
                    }
                  }}
                >
                  Mis proyectos
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
                <FaCloudArrowUp size={16} />
              </span>
              <span>Entregas TFI</span>
            </div>
            <span className={`student-sidebar-chevron ${openSections.entregas ? 'rotated' : ''}`}>
              <FaChevronDown size={12} />
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
                <FaBullhorn size={16} />
              </span>
              <span>Convocatorias PPP</span>
            </div>
            <span className={`student-sidebar-chevron ${openSections.convocatorias ? 'rotated' : ''}`}>
              <FaChevronDown size={12} />
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
                <FaClipboardList size={16} />
              </span>
              <span>Mis trámites PPP</span>
            </div>
            <span className={`student-sidebar-chevron ${openSections.tramites ? 'rotated' : ''}`}>
              <FaChevronDown size={12} />
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
                <FaUser size={16} />
              </span>
              <span>Mi perfil</span>
            </div>
            <span className={`student-sidebar-chevron ${openSections.perfil ? 'rotated' : ''}`}>
              <FaChevronDown size={12} />
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

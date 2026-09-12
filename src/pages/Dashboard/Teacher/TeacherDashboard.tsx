import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { TeacherSidebar, TeacherRoleProfile } from './components/TeacherSidebar';
import { EvaluatorDashboard } from './components/EvaluatorDashboard';
import { EvaluatorPPPTable } from './components/EvaluatorPPPTable';
import { TutorDashboard } from './components/TutorDashboard';
import { TutorProjectsTable } from './components/TutorProjectsTable';
import { RegisterTutoringModal } from './components/RegisterTutoringModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import './TeacherDashboard.css';

interface TeacherDashboardProps {
  user?: any;
  teacherType?: 'evaluador' | 'tutor';
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user: propUser,
  teacherType,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener usuario autenticado
  const currentUser = useMemo(() => {
    let u: any = {};
    if (propUser && Object.keys(propUser).length > 0) {
      u = { ...propUser };
    } else {
      try {
        u = JSON.parse(localStorage.getItem('user') || '{}');
      } catch {
        u = {};
      }
    }

    if (u && u.email) {
      try {
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        const found = usersList.find(
          (item: any) => item.email?.toLowerCase().trim() === u.email?.toLowerCase().trim()
        );
        if (found) {
          u = {
            ...found,
            ...u,
            isTutor: found.isTutor !== undefined ? found.isTutor : u.isTutor,
            nombre: found.nombre || found.firstName || u.nombre || u.firstName,
            apellido: found.apellido || found.lastName || u.apellido || u.lastName,
          };
        }
      } catch {}
    }
    return u;
  }, [propUser]);

  // Perfil estricto del profesor: Evaluador O Tutor (mutuamente excluyentes)
  const roleProfile: TeacherRoleProfile = useMemo(() => {
    if (teacherType === 'evaluador' || teacherType === 'tutor') return teacherType;
    if (currentUser?.isTutor !== undefined) return currentUser.isTutor ? 'tutor' : 'evaluador';
    const emailLower = (currentUser?.email || '').toLowerCase();
    if (emailLower.includes('tutor') || emailLower.includes('jose') || emailLower.includes('gomez')) return 'tutor';
    return 'evaluador';
  }, [teacherType, currentUser]);

  // Vista activa dentro del perfil
  const [activeView, setActiveView] = useState<string>('inicio');

  // Estado del menú desplegable de usuario
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Estados para modales
  const [tutoringModalProject, setTutoringModalProject] = useState<{
    id: string | number;
    titulo: string;
  } | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<{
    fecha: string;
    tipo: string;
    detalle: string;
    estudiante?: string;
  } | null>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formato de fecha en español (Ej. "Lunes, 28 de abril de 2025")
  const formattedDate = useMemo(() => {
    const now = new Date();
    // Para concordar estéticamente con el mockup se formatea en español
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const dateStr = now.toLocaleDateString('es-ES', options);
    // Capitalizar primer letra del día
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }, []);

  // Nombre formateado para el perfil del mockup o usuario real
  const teacherDisplayName = useMemo(() => {
    const fn = currentUser?.nombre || currentUser?.firstName;
    const ln = currentUser?.apellido || currentUser?.lastName;
    const full = [fn, ln].filter(Boolean).join(' ').trim();
    if (full) return full;
    if (currentUser?.name && currentUser.name !== 'Usuario') return currentUser.name;
    if (currentUser?.email) {
      const parts = currentUser.email
        .split('@')[0]
        .split('.')
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1));
      return parts.join(' ');
    }
    return roleProfile === 'evaluador' ? 'Profesor Evaluador' : 'Profesor Tutor';
  }, [currentUser, roleProfile]);

  const teacherFirstName = useMemo(() => {
    if (currentUser?.nombre) return currentUser.nombre;
    if (currentUser?.firstName) return currentUser.firstName;
    if (currentUser?.name && currentUser.name !== 'Usuario') {
      return currentUser.name.split(' ')[0];
    }
    if (currentUser?.email) {
      const part = currentUser.email.split('@')[0].split('.')[0];
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
    return roleProfile === 'evaluador' ? 'Profesor' : 'Tutor';
  }, [currentUser, roleProfile]);

  const teacherInitials = useMemo(() => {
    const fn = currentUser?.nombre || currentUser?.firstName;
    const ln = currentUser?.apellido || currentUser?.lastName;
    if (fn || ln) {
      const p1 = fn ? fn.charAt(0) : '';
      const p2 = ln ? ln.charAt(0) : '';
      return (p1 + p2).toUpperCase();
    }
    if (currentUser?.name && currentUser.name !== 'Usuario') {
      const parts = currentUser.name.split(' ').filter(Boolean);
      if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    }
    return roleProfile === 'evaluador' ? 'PE' : 'PT';
  }, [currentUser, roleProfile]);

  // Manejador para registrar tutoría confirmada
  const handleConfirmTutoring = (data: {
    projectId: string | number;
    studentName?: string;
    notas: string;
    fecha: string;
  }) => {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          message: `Tutoría registrada con éxito para ${data.studentName || 'el proyecto'}`,
          type: 'success',
        },
      })
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="teacher-layout">
      {/* Sidebar Lateral UNLa */}
      <TeacherSidebar
        roleProfile={roleProfile}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
      />

      {/* Área Principal con Header y Contenido */}
      <div className="teacher-content-wrapper">
        {/* Barra Superior Blanca */}
        <header className="teacher-topbar">
          <span className="teacher-topbar-date">{formattedDate}</span>

          <div className="teacher-topbar-actions">
            {/* Campana de Notificaciones */}
            <button
              type="button"
              className="teacher-icon-btn"
              title="Notificaciones"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('toast', {
                    detail: {
                      message: 'Tenés 3 notificaciones pendientes de revisión.',
                      type: 'info',
                    },
                  })
                );
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
              </svg>
              <span className="teacher-icon-badge" />
            </button>

            {/* Perfil de Usuario con Dropdown */}
            <div className="teacher-profile-dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className="teacher-profile-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="teacher-user-avatar">
                  {teacherInitials}
                </div>
                <div className="teacher-user-info">
                  <span className="teacher-user-name">{teacherDisplayName}</span>
                  <span className="teacher-user-role">
                    {roleProfile === 'evaluador' ? 'Profesor evaluador' : 'Profesor tutor'}
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="#64748b"
                  viewBox="0 0 16 16"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="teacher-dropdown-menu">
                  <button
                    type="button"
                    className="teacher-dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/change-password');
                    }}
                  >
                    Cambiar contraseña
                  </button>

                  <div className="teacher-dropdown-divider" />

                  <button
                    type="button"
                    className="teacher-dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="teacher-main-scrollable">
          {/* =============================================================
              VISTAS DEL PROFESOR EVALUADOR
              ============================================================= */}
          {roleProfile === 'evaluador' && (
            <>
              {activeView === 'inicio' && (
                <EvaluatorDashboard
                  userName={teacherFirstName}
                  onGoToPPP={() => setActiveView('ppp')}
                  onViewActivity={(act) => setSelectedActivity(act)}
                />
              )}

              {activeView === 'ppp' && (
                <EvaluatorPPPTable
                  onBackToInicio={() => setActiveView('inicio')}
                />
              )}
            </>
          )}

          {/* =============================================================
              VISTAS DEL PROFESOR TUTOR
              ============================================================= */}
          {roleProfile === 'tutor' && (
            <>
              {activeView === 'inicio' && (
                <TutorDashboard
                  userName={teacherFirstName}
                  onGoToProjects={() => setActiveView('proyectos')}
                  onViewActivity={(act) => setSelectedActivity(act)}
                />
              )}

              {activeView === 'proyectos' && (
                <TutorProjectsTable
                  onBackToInicio={() => setActiveView('inicio')}
                  onOpenRegisterTutoring={(project) => setTutoringModalProject(project)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Registrar Tutoría (Mockup 4) */}
      <RegisterTutoringModal
        isOpen={!!tutoringModalProject}
        onClose={() => setTutoringModalProject(null)}
        project={tutoringModalProject}
        onConfirm={handleConfirmTutoring}
      />

      {/* Modal Detalle de Actividad (Mockup 1 y 3) */}
      <ActivityDetailModal
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        activity={selectedActivity}
      />
    </div>
  );
};

export default TeacherDashboard;

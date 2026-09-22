import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBell, FaChevronDown } from 'react-icons/fa6';
import { useAuth } from '../../../hooks/useAuth';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { TeacherSidebar, TeacherRoleProfile } from './components/TeacherSidebar';
import { EvaluatorDashboard } from './components/EvaluatorDashboard';
import { EvaluatorPPPTable } from './components/EvaluatorPPPTable';
import { TutorDashboard } from './components/TutorDashboard';
import { TutorProjectsTable } from './components/TutorProjectsTable';
import { RegisterTutoringModal } from './components/RegisterTutoringModal';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import TeacherProjectsList from '../../Teacher/TeacherProjectsList';
import ProposalsList from '../../Admin/Proposals/ProposalsList';
import ApprovalQueue from '../../Admin/Approvals/ApprovalQueue';
import { studentWorkService } from '../../../services/studentWorkService';
import './TeacherDashboard.css';

interface TeacherDashboardProps {
  user?: any;
  teacherType?: 'evaluador' | 'tutor';
  initialView?: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user: propUser,
  teacherType,
  initialView,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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

  const { isTutor: dbIsTutor, user: dbUser } = useUserProfile();

  // Perfil estricto del profesor: Evaluador O Tutor (mutuamente excluyentes)
  // Basado en user.role === 'professor' y user.isTutor traído de la BD
  const roleProfile: TeacherRoleProfile = useMemo(() => {
    if (teacherType === 'evaluador' || teacherType === 'tutor') return teacherType;
    if (currentUser?.isTutor !== undefined) return currentUser.isTutor ? 'tutor' : 'evaluador';
    if (dbUser?.isTutor !== undefined) return dbUser.isTutor ? 'tutor' : 'evaluador';
    return dbIsTutor ? 'tutor' : 'evaluador';
  }, [teacherType, currentUser?.isTutor, dbUser?.isTutor, dbIsTutor]);

  // Vista activa dentro del perfil
  const [activeView, setActiveView] = useState<string>(() => {
    if (location.pathname === '/admin/proposals') return 'propuestas';
    if (location.pathname === '/admin/approvals') return 'solicitudes';
    return initialView || location.state?.initialView || 'inicio';
  });

  useEffect(() => {
    if (location.pathname === '/admin/proposals') {
      setActiveView('propuestas');
    } else if (location.pathname === '/admin/approvals') {
      setActiveView('solicitudes');
    } else if (initialView) {
      setActiveView(initialView);
    } else if (location.state?.initialView) {
      setActiveView(location.state.initialView);
    }
  }, [initialView, location.pathname, location.state]);

  const handleSelectView = (view: string) => {
    setActiveView(view);
    if (view === 'convocatoria-tfi') {
      if (location.pathname !== '/docente/proyectos') {
        navigate('/docente/proyectos');
      }
    } else if (view === 'inicio') {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
    } else if (view === 'proyectos') {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard', { state: { initialView: 'proyectos' } });
      }
    } else if (view === 'propuestas') {
      if (location.pathname !== '/admin/proposals') {
        navigate('/admin/proposals');
      }
    } else if (view === 'ppp') {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard', { state: { initialView: 'ppp' } });
      }
    } else if (view === 'solicitudes') {
      if (location.pathname !== '/admin/approvals') {
        navigate('/admin/approvals');
      }
    }
  };

  // Estado del menú desplegable de usuario
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Estados para modales
  const [tutoringModalProject, setTutoringModalProject] = useState<{
    id: string | number;
    titulo: string;
    workId?: string | number;
    studentName?: string;
  } | null>(null);
  const [confirmTutoringLoading, setConfirmTutoringLoading] = useState(false);
  const [projectsRefreshTrigger, setProjectsRefreshTrigger] = useState(0);

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

  // Manejador para confirmar tutoría realizada llamando al endpoint PATCH /student-work/:id/mark-tutored
  const handleConfirmTutoring = async (data: {
    projectId: string | number;
    workId: string | number;
    studentName?: string;
  }) => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: 'No se encontró una sesión activa. Por favor, iniciá sesión nuevamente.',
            type: 'error',
          },
        })
      );
      return;
    }

    if (!data.workId) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: 'No se encontró la entrega del proyecto para confirmar la tutoría.',
            type: 'error',
          },
        })
      );
      return;
    }

    setConfirmTutoringLoading(true);
    try {
      await studentWorkService.markTutored(data.workId, token);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `Tutoría confirmada con éxito para ${data.studentName || 'el proyecto'}.`,
            type: 'success',
          },
        })
      );
      setTutoringModalProject(null);
      setProjectsRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: err?.message || 'Error al confirmar la tutoría realizada.',
            type: 'error',
          },
        })
      );
    } finally {
      setConfirmTutoringLoading(false);
    }
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
        onSelectView={handleSelectView}
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
              <FaBell size={17} />
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
                <FaChevronDown
                  size={11}
                  color="#64748b"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                />
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
                  onGoToPPP={() => handleSelectView('ppp')}
                  onViewActivity={(act) => setSelectedActivity(act)}
                />
              )}

              {activeView === 'ppp' && (
                <EvaluatorPPPTable
                  onBackToInicio={() => handleSelectView('inicio')}
                />
              )}

              {activeView === 'propuestas' && (
                <ProposalsList />
              )}

              {(activeView === 'convocatoria-tfi' || activeView === 'proyectos') && (
                <TeacherProjectsList />
              )}

              {activeView === 'solicitudes' && (
                <ApprovalQueue />
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
                  onGoToProjects={() => handleSelectView('proyectos')}
                  onViewActivity={(act) => setSelectedActivity(act)}
                  onGoToApprovals={() => handleSelectView('solicitudes')}
                />
              )}

              {activeView === 'proyectos' && (
                <TutorProjectsTable
                  onBackToInicio={() => handleSelectView('inicio')}
                  onOpenRegisterTutoring={(project) => setTutoringModalProject(project)}
                  refreshTrigger={projectsRefreshTrigger}
                />
              )}

              {activeView === 'convocatoria-tfi' && (
                <TeacherProjectsList />
              )}

              {activeView === 'propuestas' && (
                <ProposalsList />
              )}

              {activeView === 'solicitudes' && (
                <ApprovalQueue />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Confirmar Tutoría */}
      <RegisterTutoringModal
        isOpen={!!tutoringModalProject}
        onClose={() => setTutoringModalProject(null)}
        project={tutoringModalProject}
        onConfirm={handleConfirmTutoring}
        loading={confirmTutoringLoading}
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

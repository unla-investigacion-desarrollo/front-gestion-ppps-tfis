import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaFileLines,
  FaUserPlus,
  FaFilePen,
  FaFolder,
} from 'react-icons/fa6';
import './Dashboard.css';

// Reusable components for Admin Dashboard
import MetricCard from './components/MetricCard';
import RecentActivityPanel from './components/RecentActivityPanel';
import SummaryRow from './components/SummaryRow';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';
import { useUserProfile } from '../../hooks/useUserProfile';
import { fetchUsers, selectUsers, selectUsersStatus } from '../../../redux/slices/usersSlice';
import { fetchProjects, selectProjects, selectProjectsStatus } from '../../../redux/slices/projectsSlice';
import {
  fetchPPPExpedientes,
  fetchPPPProposals,
  selectPPPExpedientes,
  selectPPPExpedientesStatus,
  selectPPPProposals,
  selectPPPStatus,
} from '../../../redux/slices/pppSlice';

const normalizeProjectStatus = (project) =>
  String(project.estado || '').toLowerCase().trim().replace(/[\s-]+/g, '_');

const isProjectInProgress = (project) =>
  ['in_progress', 'active', 'en_curso', 'curso'].includes(normalizeProjectStatus(project));

const isPPPProject = (project) =>
  String(project.projectType?.name || project.categoria || '').trim().toUpperCase() === 'PPP';

const parseTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatRelativeTime = (date) => {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Hace menos de un minuto';
  if (elapsedMinutes < 60) return `Hace ${elapsedMinutes} min`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Hace ${elapsedHours} h`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `Hace ${elapsedDays} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, isAdmin, isProfessor, teacherType } = useUserProfile();
  const users = useSelector(selectUsers);
  const usersStatus = useSelector(selectUsersStatus);
  const projects = useSelector(selectProjects);
  const projectsStatus = useSelector(selectProjectsStatus);
  const pppExpedientes = useSelector(selectPPPExpedientes);
  const pppExpedientesStatus = useSelector(selectPPPExpedientesStatus);
  const pppProposals = useSelector(selectPPPProposals);
  const pppProposalsStatus = useSelector(selectPPPStatus);
  const isAdminDashboard = isAdmin || role === 'admin';
  const [, setActivityVersion] = useState(0);

  useEffect(() => {
    if (!isAdminDashboard) return;

    const refreshDashboardData = () => {
      dispatch(fetchUsers());
      dispatch(fetchProjects());
      dispatch(fetchPPPExpedientes({ useLocalFallback: false }));
      dispatch(fetchPPPProposals({ isStudent: false }));
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshDashboardData();
    };

    refreshDashboardData();
    const refreshInterval = window.setInterval(refreshWhenVisible, 60000);
    window.addEventListener('focus', refreshDashboardData);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshDashboardData);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [dispatch, isAdminDashboard]);

  useEffect(() => {
    const handleActivityStorage = (storageEvent) => {
      if (storageEvent.key === 'projectActivity') {
        setActivityVersion((version) => version + 1);
      }
    };
    window.addEventListener('storage', handleActivityStorage);
    return () => window.removeEventListener('storage', handleActivityStorage);
  }, []);

  const activeUsersCount = users.filter((userItem) => userItem.estado === 'active').length;
  const inProgressProjectsCount = projects.filter(isProjectInProgress).length;
  const tfiProjectCount = projects.filter((projectItem) => !isPPPProject(projectItem)).length;
  const pppInternalCount = pppProposals.length;
  const pppExternalCount = pppExpedientes.filter((expedienteItem) => {
    const type = String(expedienteItem.type || expedienteItem.tipo || '').toLowerCase().trim();
    return type === 'externa' || type === 'external';
  }).length;
  const pppCount = pppInternalCount + pppExternalCount;
  const projectCount = tfiProjectCount + pppCount;

  const getMetricValue = (status, count) => status === 'succeeded' ? count : '—';
  const getMetricText = (status) => {
    if (status === 'failed') return 'No disponible';
    if (status !== 'succeeded') return 'Consultando información...';
    return 'Conteo actualizado';
  };

  const recentActivities = [];
  if (usersStatus === 'succeeded') {
    users.forEach((userItem) => {
      const createdAt = parseTimestamp(userItem.sourceCreatedAt);
      const updatedAt = parseTimestamp(userItem.sourceUpdatedAt);
      const roleLabel = {
        ADMIN: 'administrador',
        DOCENTE: 'docente',
        ESTUDIANTE: 'estudiante',
      }[userItem.rol] || 'usuario';
      const isActive = userItem.estado === 'active';
      const userBadge = {
        text: isActive ? 'Activo' : 'Inactivo',
        type: isActive ? 'activo' : 'inactivo',
      };

      if (createdAt) {
        recentActivities.push({
          id: `user-${userItem.id}-created`,
          timestamp: createdAt,
          title: 'Usuario registrado',
          description: `${userItem.email} se incorporó como ${roleLabel}.`,
          badgeText: userBadge.text,
          badgeType: userBadge.type,
          iconTheme: 'purple',
          icon: <FaUserPlus size={18} />,
        });
      }

      if (updatedAt && (!createdAt || updatedAt.getTime() > createdAt.getTime())) {
        recentActivities.push({
          id: `user-${userItem.id}-updated`,
          timestamp: updatedAt,
          title: 'Usuario actualizado',
          description: userItem.email,
          badgeText: userBadge.text,
          badgeType: userBadge.type,
          iconTheme: 'purple',
          icon: <FaUserPlus size={18} />,
        });
      }
    });
  }

  if (projectsStatus === 'succeeded') {
    projects.forEach((projectItem) => {
      const createdAt = parseTimestamp(projectItem.raw?.createdAt);
      const updatedAt = parseTimestamp(projectItem.raw?.updatedAt);
      const projectTitle = projectItem.titulo || 'Proyecto sin título';
      const isInProgress = isProjectInProgress(projectItem);
      const projectBadge = isInProgress
        ? { text: 'En curso', type: 'curso' }
        : { text: 'Pendiente', type: 'pendiente' };

      if (createdAt) {
        recentActivities.push({
          id: `project-${projectItem.id}-created`,
          timestamp: createdAt,
          title: 'Proyecto creado',
          description: projectTitle,
          badgeText: projectBadge.text,
          badgeType: projectBadge.type,
          iconTheme: 'blue',
          icon: <FaFilePen size={18} />,
        });
      }

      if (updatedAt && (!createdAt || updatedAt.getTime() > createdAt.getTime())) {
        recentActivities.push({
          id: `project-${projectItem.id}-updated`,
          timestamp: updatedAt,
          title: 'Proyecto actualizado',
          description: projectTitle,
          badgeText: projectBadge.text,
          badgeType: projectBadge.type,
          iconTheme: 'green',
          icon: <FaFilePen size={18} />,
        });
      }
    });
  }

  if (pppExpedientesStatus === 'succeeded') {
    pppExpedientes.forEach((expedienteItem) => {
      const createdAt = parseTimestamp(expedienteItem.createdAt);
      const updatedAt = parseTimestamp(expedienteItem.updatedAt);
      const studentName = expedienteItem.studentName || 'Estudiante';
      const isExternalPpp =
        String(expedienteItem.type || '').toLowerCase() === 'externa' ||
        String(expedienteItem.type || '').toLowerCase() === 'external';
      const expedienteTitle = expedienteItem.proposalTitle ||
        expedienteItem.proposal?.title ||
        (isExternalPpp ? 'Práctica externa' : 'Práctica interna');
      const status = String(expedienteItem.status || '').toLowerCase();
      const statusLabels = {
        pending_application: 'En evaluación',
        application_rejected: 'Desestimada',
        pending_documentation: 'Documentación',
        in_review: 'En revisión',
        observed: 'Observada',
        approved: 'Aprobada',
        disapproved: 'No aprobada',
        dropped_out: 'Baja',
      };
      const statusLabel = statusLabels[status] || 'En seguimiento';
      const badgeType = status === 'approved'
        ? 'activo'
        : ['application_rejected', 'disapproved', 'dropped_out'].includes(status)
          ? 'inactivo'
          : 'pendiente';

      if (createdAt) {
        recentActivities.push({
          id: `ppp-${expedienteItem.id}-created`,
          timestamp: createdAt,
          title: 'Trámite PPP iniciado',
          description: `${studentName} · ${expedienteTitle}`,
          badgeText: statusLabel,
          badgeType,
          iconTheme: 'blue',
          icon: <FaFilePen size={18} />,
        });
      }

      if (updatedAt && (!createdAt || updatedAt.getTime() > createdAt.getTime())) {
        recentActivities.push({
          id: `ppp-${expedienteItem.id}-updated`,
          timestamp: updatedAt,
          title: 'Trámite PPP actualizado',
          description: `${studentName} · ${expedienteTitle}`,
          badgeText: statusLabel,
          badgeType,
          iconTheme: 'green',
          icon: <FaFilePen size={18} />,
        });
      }
    });
  }

  try {
    const storedActivity = JSON.parse(localStorage.getItem('projectActivity') || '{}');
    Object.entries(storedActivity).forEach(([projectId, projectActivities]) => {
      if (!Array.isArray(projectActivities)) return;
      const projectItem = projects.find((candidate) => String(candidate.id) === String(projectId));
      const projectTitle = projectItem?.titulo || `Proyecto #${projectId}`;

      projectActivities.forEach((activity) => {
        const timestamp = parseTimestamp(activity.at);
        if (!timestamp) return;

        const activityDetails = {
          message: { title: 'Mensaje en proyecto', badgeText: 'Mensaje', badgeType: 'curso', iconTheme: 'blue' },
          delivery: { title: 'Entrega registrada', badgeText: 'Entrega', badgeType: 'pendiente', iconTheme: 'green' },
          teacher_note: { title: 'Observación de entrega', badgeText: 'Observación', badgeType: 'inactivo', iconTheme: 'purple' },
        }[activity.type];
        if (!activityDetails) return;

        const activityUser = users.find((candidate) => String(candidate.id) === String(activity.by));
        const userName = activityUser
          ? [activityUser.nombre, activityUser.apellido].filter(Boolean).join(' ') || activityUser.email
          : 'Usuario';

        recentActivities.push({
          id: `interaction-${activity.id}`,
          timestamp,
          title: activityDetails.title,
          description: `${projectTitle} · ${userName}`,
          badgeText: activityDetails.badgeText,
          badgeType: activityDetails.badgeType,
          iconTheme: activityDetails.iconTheme,
          icon: <FaFilePen size={18} />,
        });
      });
    });
  } catch {
    // Ignorar un historial local malformado y conservar los eventos provenientes de la API.
  }

  recentActivities.sort((activityA, activityB) => activityB.timestamp - activityA.timestamp);
  const latestActivities = recentActivities.slice(0, 5);
  const summaryTotalsLoaded =
    projectsStatus === 'succeeded' &&
    pppProposalsStatus === 'succeeded' &&
    pppExpedientesStatus === 'succeeded';
  const allDataLoaded =
    usersStatus === 'succeeded' &&
    projectsStatus === 'succeeded' &&
    pppExpedientesStatus === 'succeeded';
  const hasDataError =
    usersStatus === 'failed' ||
    projectsStatus === 'failed' ||
    pppExpedientesStatus === 'failed';

  // Según la especificación del usuario:
  // if (user.role === 'admin')
  if (isAdminDashboard) {
    return (
      <div className="admin-dashboard-container">
        {/* Title */}
        <div className="admin-dashboard-title-section d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h1>Inicio</h1>
            <p>Resumen general del sistema</p>
          </div>
          <span className="admin-realtime-pill">Datos en tiempo real</span>
        </div>

        {/* 3 Equal Minimalist Cards Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div
              className="admin-minimal-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/admin/users')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/admin/users');
              }}
            >
              <div className="admin-minimal-card-header">
                <span className="admin-minimal-card-label">Usuarios activos</span>
                <FaUsers size={16} className="admin-minimal-card-icon" />
              </div>
              <div className="admin-minimal-card-value">
                {getMetricValue(usersStatus, activeUsersCount)}
              </div>
              <div className="admin-minimal-card-footer">→ {getMetricText(usersStatus)}</div>
            </div>
          </div>

          <div className="col-md-4">
            <div
              className="admin-minimal-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/docente/proyectos')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/docente/proyectos');
              }}
            >
              <div className="admin-minimal-card-header">
                <span className="admin-minimal-card-label">Proyectos en curso</span>
                <FaFolder size={16} className="admin-minimal-card-icon" />
              </div>
              <div className="admin-minimal-card-value">
                {getMetricValue(projectsStatus, inProgressProjectsCount)}
              </div>
              <div className="admin-minimal-card-footer">→ {getMetricText(projectsStatus)}</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="admin-minimal-card admin-minimal-summary-card">
              <div className="admin-minimal-card-header mb-2">
                <span className="admin-minimal-card-label">Resumen por tipo</span>
              </div>
              <div className="admin-summary-rows">
                <div className="admin-summary-row">
                  <span className="admin-summary-label">
                    <span className="admin-summary-dot dot-tfi" />
                    TFI
                  </span>
                  <span className="admin-summary-value">
                    {getMetricValue(projectsStatus, tfiProjectCount)}
                  </span>
                </div>
                <div className="admin-summary-row">
                  <span className="admin-summary-label">
                    <span className="admin-summary-dot dot-ppp" />
                    PPP Interna
                  </span>
                  <span className="admin-summary-value">
                    {getMetricValue(pppProposalsStatus, pppInternalCount)}
                  </span>
                </div>
                <div className="admin-summary-row">
                  <span className="admin-summary-label">
                    <span className="admin-summary-dot dot-ppp-external" />
                    PPP Externa
                  </span>
                  <span className="admin-summary-value">
                    {getMetricValue(pppExpedientesStatus, pppExternalCount)}
                  </span>
                </div>
              </div>
              <div className="admin-summary-total">
                <span>Proyectos totales</span>
                <strong>{summaryTotalsLoaded ? projectCount : '—'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Row: Full-width Recent Activity */}
        <div className="row">
          <div className="col-12">
            <RecentActivityPanel
              activities={latestActivities.map((activityItem) => ({
                ...activityItem,
                time: formatRelativeTime(activityItem.timestamp),
              }))}
              isLoading={!allDataLoaded && !hasDataError}
              hasError={hasDataError}
              onManageUsers={() => navigate('/admin/users')}
            />
          </div>
        </div>
      </div>
    );
  }

  // if (user.role === 'professor')
  //   if (user.isTutor) { Vista de tutor } else { Vista de evaluador }
  if (isProfessor || role === 'professor') {
    return <TeacherDashboard user={user} teacherType={teacherType} />;
  }

  // if (user.role === 'student')
  return <StudentDashboard user={user} />;
};

export default Dashboard;


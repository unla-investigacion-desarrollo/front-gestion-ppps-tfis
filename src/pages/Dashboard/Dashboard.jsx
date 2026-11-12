import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaFileLines,
  FaUserPlus,
  FaFilePen,
  FaChartColumn,
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
  selectPPPExpedientes,
  selectPPPExpedientesStatus,
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
  const isAdminDashboard = isAdmin || role === 'admin';
  const [lastDataSync, setLastDataSync] = useState(null);
  const [, setActivityVersion] = useState(0);

  useEffect(() => {
    if (!isAdminDashboard) return;
    dispatch(fetchUsers());
    dispatch(fetchProjects());
    dispatch(fetchPPPExpedientes({ useLocalFallback: false }));
  }, [dispatch, isAdminDashboard]);

  useEffect(() => {
    if (
      usersStatus === 'succeeded' &&
      projectsStatus === 'succeeded' &&
      pppExpedientesStatus === 'succeeded'
    ) {
      setLastDataSync(new Date());
    }
  }, [usersStatus, projectsStatus, pppExpedientesStatus]);

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
  const pppCount = pppExpedientes.length;
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
        <div className="admin-dashboard-title-section">
          <h1>Inicio</h1>
          <p>Resumen general del sistema.</p>
        </div>

        {/* 3 Cards Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <MetricCard
              title="Usuarios activos"
              value={getMetricValue(usersStatus, activeUsersCount)}
              trendText={getMetricText(usersStatus)}
              trendDirection="none"
              colorTheme="purple"
              onClick={() => navigate('/admin/users')}
              icon={<FaUsers size={24} />}
            />
          </div>
          <div className="col-md-6">
            <MetricCard
              title="Proyectos en curso"
              value={getMetricValue(projectsStatus, inProgressProjectsCount)}
              trendText={getMetricText(projectsStatus)}
              trendDirection="none"
              colorTheme="green"
              onClick={() => navigate('/docente/proyectos')}
              icon={<FaFileLines size={24} />}
            />
          </div>
        </div>

        {/* Lower Row: Activity + Summary */}
        <div className="row g-3">
          <div className="col-md-8">
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

          {/* Right Panel: Summary */}
          <div className="col-md-4 d-flex flex-column">
            <div className="dashboard-panel-card">
              <h3 className="panel-card-title mb-3 d-flex align-items-center gap-2">
                <FaChartColumn size={20} color="var(--unla-primary)" />
                Resumen por tipo
              </h3>
              <div className="summary-list d-flex flex-column gap-1">
                <SummaryRow label="TFI" value={getMetricValue(projectsStatus, tfiProjectCount)} theme="tfi" />
                <SummaryRow label="PPP" value={getMetricValue(pppExpedientesStatus, pppCount)} theme="ppp" />
                <SummaryRow
                  label="Proyectos"
                  value={allDataLoaded ? projectCount : '—'}
                  theme="proyectos"
                />
              </div>
            </div>
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


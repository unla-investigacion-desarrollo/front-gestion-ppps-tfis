import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaFileLines,
  FaFolderOpen,
  FaClockRotateLeft,
  FaUserPlus,
  FaFileCircleCheck,
  FaFilePen,
  FaUserXmark,
  FaChartColumn,
  FaCircleInfo,
  FaCalendarDays,
} from 'react-icons/fa6';
import './Dashboard.css';

// Reusable components for Admin Dashboard
import MetricCard from './components/MetricCard';
import ActivityItem from './components/ActivityItem';
import SummaryRow from './components/SummaryRow';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';
import { useUserProfile } from '../../hooks/useUserProfile';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, isAdmin, isStudent, isProfessor, teacherType } = useUserProfile();

  const lastProposal = useMemo(() => {
    try {
      const rawProposals = localStorage.getItem('proposals');
      const proposalsList = rawProposals ? JSON.parse(rawProposals) : [];
      const userProposals = user?.id
        ? proposalsList.filter((proposal) => proposal.userId === user.id)
        : proposalsList;
      return (
        userProposals.sort((proposalA, proposalB) =>
          (proposalB.uploadedAt || '').localeCompare(proposalA.uploadedAt || '')
        )[0] || null
      );
    } catch {
      return null;
    }
  }, [user]);

  // Según la especificación del usuario:
  // if (user.role === 'admin')
  if (isAdmin || role === 'admin') {
    return (
      <div className="admin-dashboard-container">
        {/* Title */}
        <div className="admin-dashboard-title-section">
          <h1>Inicio</h1>
          <p>Resumen general del sistema.</p>
        </div>

        {/* 3 Cards Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <MetricCard
              title="Usuarios activos"
              value="8"
              trendText="2 más que el mes anterior"
              trendDirection="up"
              colorTheme="purple"
              onClick={() => navigate('/admin/users')}
              icon={<FaUsers size={24} />}
            />
          </div>
          <div className="col-md-4">
            <MetricCard
              title="Proyectos en curso"
              value="12"
              trendText="3 más que el mes anterior"
              trendDirection="up"
              colorTheme="green"
              onClick={() => navigate('/docente/proyectos')}
              icon={<FaFileLines size={24} />}
            />
          </div>
          <div className="col-md-4">
            <MetricCard
              title="Propuestas pendientes"
              value="3"
              trendText="Sin cambios"
              trendDirection="none"
              colorTheme="yellow"
              onClick={() => navigate('/admin/proposals')}
              icon={<FaFolderOpen size={24} />}
            />
          </div>
        </div>

        {/* Lower Row: Activity + Summary */}
        <div className="row g-3">
          {/* Recent Activity */}
          <div className="col-md-8">
            <div className="dashboard-panel-card">
              <div className="panel-card-header">
                <h3 className="panel-card-title d-flex align-items-center gap-2">
                  <FaClockRotateLeft size={20} color="var(--unla-primary)" />
                  Actividad reciente
                </h3>
                <a href="#/" onClick={(event) => { event.preventDefault(); navigate('/admin/users'); }} className="panel-card-link">Ver todas →</a>
              </div>
              <div className="activity-list">
                <ActivityItem
                  title="Nuevo usuario registrado"
                  description="se sumó el usuario juan.perez@unla.edu.ar con rol Estudiante."
                  time="Hace 2 horas"
                  badgeText="Activo"
                  badgeType="activo"
                  iconTheme="purple"
                  icon={<FaUserPlus size={18} />}
                />
                <ActivityItem
                  title="Propuesta aprobada"
                  description='La propuesta "Análisis de rendimiento en servicios distribuidos" fue aprobada.'
                  time="Hace 4 horas"
                  badgeText="Aprobada"
                  badgeType="aprobada"
                  iconTheme="yellow"
                  icon={<FaFileCircleCheck size={18} />}
                />
                <ActivityItem
                  title="Solicitud de proyecto recibida"
                  description='Se recibió una nueva solicitud de postulación a proyecto de TFI.'
                  time="Hace 6 horas"
                  badgeText="Pendiente"
                  badgeType="pendiente"
                  iconTheme="blue"
                  icon={<FaFilePen size={18} />}
                />
                <ActivityItem
                  title="Proyecto actualizado"
                  description='El proyecto "App móvil - TFI" fue actualizado por el docente.'
                  time="Ayer, 16:32"
                  badgeText="En curso"
                  badgeType="curso"
                  iconTheme="green"
                  icon={<FaFilePen size={18} />}
                />
                <ActivityItem
                  title="Usuario desactivado"
                  description="Se desactivó la cuenta de maria.gomez@unla.edu.ar."
                  time="Ayer, 11:20"
                  badgeText="Inactivo"
                  badgeType="inactivo"
                  iconTheme="purple"
                  icon={<FaUserXmark size={18} />}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Summary + Status */}
          <div className="col-md-4 d-flex flex-column justify-content-between">
            <div className="dashboard-panel-card">
              <h3 className="panel-card-title mb-3 d-flex align-items-center gap-2">
                <FaChartColumn size={20} color="var(--unla-primary)" />
                Resumen por tipo
              </h3>
              <div className="summary-list d-flex flex-column gap-1">
                <SummaryRow label="TFI" value="7" theme="tfi" />
                <SummaryRow label="PPP" value="5" theme="ppp" />
                <SummaryRow label="Propuestas" value="3" theme="propuestas" />
                <SummaryRow label="Proyectos" value="12" theme="proyectos" />
              </div>
            </div>

            {/* System Status Alert Card */}
            <div className="system-status-card">
              <div className="system-status-title d-flex align-items-center gap-2">
                <FaCircleInfo size={18} />
                Sistema en funcionamiento
              </div>
              <span className="system-status-desc">Última actualización de datos</span>
              <div className="system-status-time d-flex align-items-center gap-1.5">
                <FaCalendarDays size={14} />
                25 ago 2025 - 10:45
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


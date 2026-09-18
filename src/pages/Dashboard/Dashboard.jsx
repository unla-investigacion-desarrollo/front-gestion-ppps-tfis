import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaFileLines,
  FaFolderOpen,
  FaCircleCheck,
  FaClockRotateLeft,
  FaUserPlus,
  FaFileCircleCheck,
  FaCloudArrowUp,
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

const Dashboard = () => {
  const navigate = useNavigate();
  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // Determinar rol estricto y mutuamente excluyente del usuario
  const userProfile = useMemo(() => {
    let u = { ...usuario };

    // Si u no tiene nombre o isTutor definido, buscar en el listado registrado 'users' de localStorage
    if (u && u.email) {
      try {
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        const found = usersList.find(
          (item) => item.email?.toLowerCase().trim() === u.email?.toLowerCase().trim()
        );
        if (found) {
          u = {
            ...found,
            ...u,
            isTutor: found.isTutor !== undefined ? found.isTutor : u.isTutor,
            nombre: found.nombre || found.firstName || u.nombre || u.firstName,
            apellido: found.apellido || found.lastName || u.apellido || u.lastName,
            name: [
              found.nombre || found.firstName || u.nombre || u.firstName,
              found.apellido || found.lastName || u.apellido || u.lastName,
            ].filter(Boolean).join(' ') || u.name,
          };
        }
      } catch {}
    }

    const rawRoles = Array.isArray(u?.roles) ? [...u.roles] : u?.roles ? [u.roles] : [];
    if (u?.rol) rawRoles.push(u.rol);
    const normalizedRoles = rawRoles.map((role) => String(role).toUpperCase().trim());

    // 1. Si es Admin, es estrictamente Administrador (no docente ni estudiante)
    if (normalizedRoles.some((role) => ['ADMIN', 'ADMINISTRADOR'].includes(role))) {
      return { role: 'ADMIN', user: u };
    }

    // 2. Si es Docente: Es estrictamente Evaluador O Tutor, NUNCA ambos
    const isDocente =
      normalizedRoles.some((role) =>
        ['DOCENTE', 'TEACHER', 'PROFESSOR', 'PROFESOR', 'TUTOR', 'EVALUADOR'].includes(role)
      ) ||
      (u?.email && u.email.toLowerCase().includes('profesor')) ||
      (u?.email && u.email.toLowerCase().includes('docente')) ||
      (u?.email && u.email.toLowerCase().includes('tutor'));

    if (isDocente) {
      // Se define según el perfil del usuario antes de decidir qué dashboard ve
      const isTutor = Boolean(
        u?.isTutor === true ||
        u?.isTutor === 'true' ||
        normalizedRoles.includes('TUTOR') ||
        (u?.email && u.email.toLowerCase().includes('tutor')) ||
        (u?.email && (u.email.toLowerCase().includes('jose') || u.email.toLowerCase().includes('gomez')))
      );

      const emailParts = (u?.email || '').split('@')[0].split('.');
      const fallbackNombre = emailParts[0] ? (emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1)) : (isTutor ? 'Profesor' : 'Docente');
      const fallbackApellido = emailParts[1] ? (emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1)) : (isTutor ? 'Tutor' : 'Evaluador');

      const enrichedUser = {
        ...u,
        isTutor,
        nombre: u.nombre || u.firstName || fallbackNombre,
        apellido: u.apellido || u.lastName || fallbackApellido,
        name: [u.nombre || u.firstName || fallbackNombre, u.apellido || u.lastName || fallbackApellido].filter(Boolean).join(' ') || u.name,
      };

      return {
        role: 'DOCENTE',
        teacherType: isTutor ? 'tutor' : 'evaluador',
        user: enrichedUser,
      };
    }

    // 3. Por defecto es Estudiante
    return { role: 'ESTUDIANTE', user: u };
  }, [usuario]);

  const lastProposal = useMemo(() => {
    try {
      const rawProposals = localStorage.getItem('proposals');
      const proposalsList = rawProposals ? JSON.parse(rawProposals) : [];
      const userProposals = usuario?.id
        ? proposalsList.filter((proposal) => proposal.userId === usuario.id)
        : proposalsList;
      return (
        userProposals.sort((proposalA, proposalB) =>
          (proposalB.uploadedAt || '').localeCompare(proposalA.uploadedAt || '')
        )[0] || null
      );
    } catch {
      return null;
    }
  }, [usuario]);

  // Render Admin Redesigned Dashboard
  if (userProfile.role === 'ADMIN') {
    return (
      <div className="admin-dashboard-container">
        {/* Title */}
        <div className="admin-dashboard-title-section">
          <h1>Inicio</h1>
          <p>Resumen general del sistema.</p>
        </div>

        {/* 4 Cards Row */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
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
          <div className="col-md-3">
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
          <div className="col-md-3">
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
          <div className="col-md-3">
            <MetricCard
              title="Entregas pendientes de revisión"
              value="5"
              trendText="2 más que el mes anterior"
              trendDirection="up"
              colorTheme="blue"
              onClick={() => navigate('/docente/entregas')}
              icon={<FaCircleCheck size={24} />}
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
                  title="Entrega recibida"
                  description='Se recibió una nueva entrega para el proyecto "Plataforma de gestión".'
                  time="Hace 6 horas"
                  badgeText="Pendiente"
                  badgeType="pendiente"
                  iconTheme="blue"
                  icon={<FaCloudArrowUp size={18} />}
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
                <SummaryRow label="Entregas" value="5" theme="entregas" />
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

  if (userProfile.role === 'DOCENTE') {
    return <TeacherDashboard user={userProfile.user} teacherType={userProfile.teacherType} />;
  }

  return <StudentDashboard user={usuario} />;
};

export default Dashboard;


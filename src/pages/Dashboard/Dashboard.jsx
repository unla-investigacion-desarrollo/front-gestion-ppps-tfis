import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.047 1.09-2.904.243-.294.556-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                </svg>
              }
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
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                  <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                </svg>
              }
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
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .997l.003.088h4.69v-.792z"/>
                </svg>
              }
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
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
              }
            />
          </div>
        </div>

        {/* Lower Row: Activity + Summary */}
        <div className="row g-3">
          {/* Recent Activity */}
          <div className="col-md-8">
            <div className="dashboard-panel-card">
              <div className="panel-card-header">
                <h3 className="panel-card-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="var(--unla-primary)" className="bi bi-clock-history" viewBox="0 0 16 16">
                    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.848 1.435a6.97 6.97 0 0 0-.538-.79l.8-.6c.228.305.428.636.598.986l-.86.404zm.71 1.368a7.01 7.01 0 0 0-.299-.985l.933-.36c.16.417.292.847.39 1.286l-.976-.231zm.45 2.004a7 7 0 0 0-.022-.589h.997a8.03 8.03 0 0 1 .023.702h-.998a6.97 6.97 0 0 0 0-.113zM16 8a8 8 0 1 1-8-8v1a7 7 0 1 0 7 7h1zm-9 3.5a.5.5 0 0 0 1 0V7.9l2.2 1.3a.5.5 0 1 0 .5-.86l-2.5-1.5A.5.5 0 0 0 7 7v4.5z"/>
                  </svg>
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
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.5-3a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"/>
                    </svg>
                  }
                />
                <ActivityItem
                  title="Propuesta aprobada"
                  description='La propuesta "Análisis de rendimiento en servicios distribuidos" fue aprobada.'
                  time="Hace 4 horas"
                  badgeText="Aprobada"
                  badgeType="aprobada"
                  iconTheme="yellow"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M9.2 0H1.8C1 0 0 1 0 1.8v12.4C0 15 1 16 1.8 16h12.4c.8 0 1.8-1 1.8-1.8V4.8L9.2 0zM10 6v3.2l-1.6-1.6a.5.5 0 0 0-.7.7l2 2a.5.5 0 0 0 .7 0l4-4a.5.5 0 0 0-.7-.7L10 6z"/>
                    </svg>
                  }
                />
                <ActivityItem
                  title="Entrega recibida"
                  description='Se recibió una nueva entrega para el proyecto "Plataforma de gestión".'
                  time="Hace 6 horas"
                  badgeText="Pendiente"
                  badgeType="pendiente"
                  iconTheme="blue"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7.5 3.5a.5.5 0 0 0 1 0V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5z"/>
                    </svg>
                  }
                />
                <ActivityItem
                  title="Proyecto actualizado"
                  description='El proyecto "App móvil - TFI" fue actualizado por el docente.'
                  time="Ayer, 16:32"
                  badgeText="En curso"
                  badgeType="curso"
                  iconTheme="green"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-1.5 4.5V3H12v1.5h-1.5zM4 5.5h8v1H4v-1zm0 3h8v1H4v-1zm0 3h5v1H4v-1z"/>
                    </svg>
                  }
                />
                <ActivityItem
                  title="Usuario desactivado"
                  description="Se desactivó la cuenta de maria.gomez@unla.edu.ar."
                  time="Ayer, 11:20"
                  badgeText="Inactivo"
                  badgeType="inactivo"
                  iconTheme="purple"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6.146-2.854a.5.5 0 1 1 .708.708L11.707 6l1.147 1.146a.5.5 0 0 1-.708.708L11 6.707l-1.146 1.147a.5.5 0 0 1-.708-.708L10.293 6 9.146 4.854a.5.5 0 0 1 .708-.708L11 5.293l1.146-1.147z"/>
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Summary + Status */}
          <div className="col-md-4 d-flex flex-column justify-content-between">
            <div className="dashboard-panel-card">
              <h3 className="panel-card-title mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="var(--unla-primary)" className="bi bi-bar-chart-line-fill" viewBox="0 0 16 16">
                  <path d="M11 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h1V7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7h1V2z"/>
                </svg>
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
              <div className="system-status-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-info-circle-fill" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                Sistema en funcionamiento
              </div>
              <span className="system-status-desc">Última actualización de datos</span>
              <div className="system-status-time">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-calendar3" viewBox="0 0 16 16">
                  <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857V3.857z"/>
                  <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                </svg>
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


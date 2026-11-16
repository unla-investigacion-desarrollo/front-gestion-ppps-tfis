import React, { useEffect, useState } from 'react';
import {
  FaFileLines,
  FaChalkboardUser,
  FaTriangleExclamation,
  FaGraduationCap,
} from 'react-icons/fa6';
import { projectService } from '../../../../services/projectService';
import { studentWorkService } from '../../../../services/studentWorkService';

interface RecentTutoring {
  id: string;
  projectName: string;
  studentName: string;
  date: string;
  timestamp: number;
}

interface TutorDashboardData {
  activeProjects: number;
  tutoringRequests: number;
  projectsWithoutDelivery: number;
  recentTutorings: RecentTutoring[];
}

const getStudentName = (project: any): string => {
  const students =
    project?.activeStudents || project?.students || project?.users || [];
  if (!Array.isArray(students)) return '';

  const student = students.find((item: any) => item && item.active !== false);
  if (!student) return '';

  const user = student.student?.user || student.user || student.student || student;
  const fullName = [user.firstName || user.nombre, user.lastName || user.apellido]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || user.name || user.email || '';
};

interface TutorDashboardProps {
  userName: string;
  onGoToProjects: () => void;
  onViewActivity: (act: { fecha: string; tipo: string; detalle: string; estudiante?: string }) => void;
}

export const TutorDashboard: React.FC<TutorDashboardProps> = ({
  userName,
  onGoToProjects,
  onViewActivity,
}) => {
  const [dashboardData, setDashboardData] = useState<TutorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      const token = localStorage.getItem('token') || '';
      if (!token) {
        setError('No se encontró una sesión activa. Por favor, iniciá sesión nuevamente.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const activeProjects = await projectService.getMyActiveProjects(token);
        if (!Array.isArray(activeProjects)) {
          throw new Error('La respuesta de proyectos activos no es válida.');
        }

        const projectWorks = await Promise.all(
          activeProjects.map(async (projectItem: any) => {
            const project = projectItem.project || projectItem;
            const projectId = project.id || projectItem.id;
            if (!projectId) {
              throw new Error('No se pudo identificar un proyecto para consultar su entrega.');
            }

            const work =
              project.studentWork ||
              projectItem.studentWork ||
              (await studentWorkService.getWorkByProject(projectId, token));

            return { project, work };
          })
        );

        const recentTutorings = projectWorks
          .map(({ project, work }) => {
            const rawDate = work?.lastTutoredAt || project.lastTutoredAt;
            const timestamp = rawDate ? new Date(rawDate).getTime() : Number.NaN;
            if (!Number.isFinite(timestamp)) return null;

            const date = new Date(timestamp);
            return {
              id: String(work?.id || project.id),
              projectName: project.title || project.titulo || 'Proyecto sin título',
              studentName:
                getStudentName(project) ||
                getStudentName(work?.project) ||
                'Estudiante sin nombre',
              date: date.toLocaleString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp,
            };
          })
          .filter((tutoring): tutoring is RecentTutoring => tutoring !== null)
          .sort((first, second) => second.timestamp - first.timestamp)
          .slice(0, 3);

        if (isMounted) {
          setDashboardData({
            activeProjects: activeProjects.length,
            tutoringRequests: projectWorks.filter(({ work }) => work?.tutoringRequested).length,
            projectsWithoutDelivery: projectWorks.filter(({ work }) => !work).length,
            recentTutorings,
          });
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los datos del dashboard.'
          );
          setDashboardData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      {/* Saludo */}
      <h1 className="teacher-page-title">
        Bienvenido, {userName}
      </h1>
      <p className="teacher-page-subtitle">
        Aquí tenés un resumen de tus proyectos y tutorías pendientes.
      </p>

      {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}

      {/* Métricas principales */}
      <div className="row g-3 mb-4">
        {/* Card 1: Mis proyectos activos */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box blue">
                <FaFileLines size={18} />
              </div>
              <h3 className="teacher-metric-title">Mis proyectos activos</h3>
            </div>
            <div className="teacher-metric-value">
              {loading ? '…' : dashboardData?.activeProjects ?? '—'}
            </div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToProjects}
            >
              Ver proyectos →
            </button>
          </div>
        </div>

        {/* Card 2: Solicitudes de tutoría */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box purple">
                <FaChalkboardUser size={18} />
              </div>
              <h3 className="teacher-metric-title">Solicitudes de tutoría</h3>
            </div>
            <div className="teacher-metric-value">
              {loading ? '…' : dashboardData?.tutoringRequests ?? '—'}
            </div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToProjects}
            >
              Ver pendientes →
            </button>
          </div>
        </div>

        {/* Card 3: Proyectos sin entrega */}
        <div className="col-lg-4 col-md-6">
          <div className="teacher-card teacher-metric-large-card">
            <div className="teacher-metric-header">
              <div className="teacher-card-icon-box red">
                <FaTriangleExclamation size={18} />
              </div>
              <h3 className="teacher-metric-title">Proyectos sin entrega</h3>
            </div>
            <div className="teacher-metric-value">
              {loading ? '…' : dashboardData?.projectsWithoutDelivery ?? '—'}
            </div>
            <button
              type="button"
              className="teacher-card-action-link bg-transparent border-0 p-0 text-start"
              onClick={onGoToProjects}
            >
              Ver proyectos →
            </button>
          </div>
        </div>
      </div>

      {/* Fila Inferior Dividida */}
      <div className="row g-4">
        {/* Columna Izquierda: Tabla Últimas tutorías registradas */}
        <div className="col-lg-8">
          <div className="teacher-table-card">
            <div className="teacher-table-header-row">
              <h2 className="teacher-table-title">Últimas tutorías registradas</h2>
              <button
                type="button"
                className="teacher-table-link bg-transparent border-0 p-0"
                onClick={onGoToProjects}
              >
                Ver todas
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle teacher-bootstrap-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '35%' }}>Proyecto</th>
                    <th scope="col" style={{ width: '25%' }}>Estudiante</th>
                    <th scope="col" style={{ width: '25%' }}>Fecha</th>
                    <th scope="col" style={{ width: '15%', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center text-secondary py-4">
                        Cargando tutorías…
                      </td>
                    </tr>
                  ) : dashboardData?.recentTutorings.length ? (
                    dashboardData.recentTutorings.map((tutoring) => (
                      <tr key={tutoring.id}>
                        <td className="fw-semibold text-dark">{tutoring.projectName}</td>
                        <td className="text-secondary">{tutoring.studentName}</td>
                        <td className="text-secondary">{tutoring.date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm teacher-btn-view-outline"
                            onClick={() =>
                              onViewActivity({
                                fecha: tutoring.date,
                                tipo: 'Tutoría',
                                detalle: `Sesión de tutoría - ${tutoring.projectName}`,
                                estudiante: tutoring.studentName,
                              })
                            }
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center text-secondary py-4">
                        {error ? 'No se pudieron cargar las tutorías.' : 'Todavía no hay tutorías registradas.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Motivacional con Birrete */}
        <div className="col-lg-4">
          <div className="teacher-tutor-banner-card">
            <FaGraduationCap className="teacher-tutor-banner-icon" />
            <h3 className="teacher-tutor-banner-title">
              Tu acompañamiento hace la diferencia
            </h3>
            <p className="teacher-tutor-banner-text">
              Las tutorías ayudan a que los estudiantes puedan avanzar, resolver dudas y fortalecer sus proyectos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaFolderOpen,
  FaCalendarDays,
  FaEye,
  FaChalkboardUser,
  FaGraduationCap,
  FaUserGroup,
} from 'react-icons/fa6';
import { projectService } from '../../../../services/projectService';
import { studentWorkService } from '../../../../services/studentWorkService';
import TutorProjectFilters from './TutorProjectFilters';
import TutorProjectStatusPill from './TutorProjectStatusPill';
import MyTfiCard from '../../../Student/components/MyTfiCard';

// Importar estilos compartidos del módulo de gestión de proyectos
import '../../../Teacher/TeacherProjectsList.css';

export interface TutorProjectRecord {
  id: string;
  proyecto: string;
  subtitulo: string;
  estudiantePrincipal: string;
  estudiantesExtras: string;
  estudiantesAsignados: string[];
  docentesAsignados: string[];
  estado: 'En curso' | 'Pendiente' | 'Finalizado';
  estadoClass: 'curso' | 'revision' | 'finalizado';
  ultimaTutoria: string;
  tutoringRequested: boolean;
  workId?: number;
  rawProject?: any;
}

interface TutorProjectsTableProps {
  onOpenRegisterTutoring?: (project: {
    id: string | number;
    titulo: string;
    workId?: string | number;
    studentName?: string;
  }) => void;
  refreshTrigger?: number;
  isStudent?: boolean;
  onBackToInicio?: () => void;
}

/**
 * Componente que renderiza el listado de "Mis proyectos" del Profesor Tutor
 * (con asignaciones y registro de tutorías).
 * Para Estudiantes renderiza la ficha "Mi TFI", ya que solo pueden tener un único TFI.
 */
export const TutorProjectsTable: React.FC<TutorProjectsTableProps> = ({
  onOpenRegisterTutoring,
  refreshTrigger,
  isStudent = false,
}) => {
  const navigate = useNavigate();

  // Estados de carga y datos desde la API
  const [projectsList, setProjectsList] = useState<TutorProjectRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Estados de paginación
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Obtener proyectos activos del usuario (profesor o estudiante) desde el backend
  const fetchMyProjects = useCallback(async () => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      setError('No se encontró una sesión activa. Por favor, iniciá sesión nuevamente.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await projectService.getMyActiveProjects(token);
      const list = Array.isArray(data) ? data : [];

      // Consultar la entrega de cada proyecto en paralelo para obtener tutoringRequested y workId
      const workResults = await Promise.allSettled(
        list.map((projectItemCandidate: any) => {
          const projectData = projectItemCandidate.project || projectItemCandidate;
          const projectId = projectData.id || projectItemCandidate.id;
          if (projectData.studentWork || projectItemCandidate.studentWork) {
            return Promise.resolve(projectData.studentWork || projectItemCandidate.studentWork);
          }
          if (projectId) {
            return studentWorkService.getWorkByProject(projectId, token);
          }
          return Promise.resolve(null);
        })
      );

      const mapped: TutorProjectRecord[] = list.map((projectItemCandidate: any, projectIndex: number) => {
        const projectData = projectItemCandidate.project || projectItemCandidate;
        const projectId = String(projectData.id || projectItemCandidate.id || '');
        const title = projectData.title || projectData.titulo || 'Proyecto sin título';
        const description = projectData.description || projectData.descripcion || 'Sin descripción';

        const work = workResults[projectIndex]?.status === 'fulfilled' ? workResults[projectIndex].value : null;
        const workId = work?.id ? Number(work.id) : undefined;
        const tutoringRequested = Boolean(work?.tutoringRequested);

        // Extraer alumnos asignados al proyecto (matcheado con activeStudents)
        let studentNames: string[] = [];
        const rawStudents =
          (Array.isArray(projectData.activeStudents) ? projectData.activeStudents : null) ||
          (Array.isArray(projectItemCandidate.activeStudents) ? projectItemCandidate.activeStudents : null) ||
          projectData.students ||
          projectData.users ||
          [];
        if (Array.isArray(rawStudents)) {
          studentNames = rawStudents
            .filter((rawStudent: any) => rawStudent && rawStudent.active !== false)
            .map((rawStudent: any) => {
              if (typeof rawStudent === 'string') return rawStudent;
              const studentObject = rawStudent.student?.user || rawStudent.user || rawStudent.student || rawStudent;
              const firstName = studentObject.firstName || studentObject.nombre || '';
              const lastName = studentObject.lastName || studentObject.apellido || '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
              return fullName || studentObject.name || studentObject.email || '';
            })
            .filter(Boolean);
        }

        // Extraer docentes o tutor asignados al proyecto
        let teacherNames: string[] = [];
        const rawTeachers = [
          ...(Array.isArray(projectData.activeProfessors) ? projectData.activeProfessors : []),
          ...(Array.isArray(projectData.professors) ? projectData.professors : []),
          ...(Array.isArray(projectData.teachers) ? projectData.teachers : []),
          ...(Array.isArray(projectData.coTeachers) ? projectData.coTeachers : []),
          projectData.teacher,
          projectData.tutor,
          projectItemCandidate.teacher,
          projectData.teacherId ? `Docente #${projectData.teacherId}` : null,
        ].filter(Boolean);

        if (Array.isArray(rawTeachers)) {
          teacherNames = rawTeachers
            .map((rawTeacher: any) => {
              if (!rawTeacher || rawTeacher.active === false) return '';
              if (typeof rawTeacher === 'string' || typeof rawTeacher === 'number') return String(rawTeacher);
              const teacherObject = rawTeacher.professor?.user || rawTeacher.user || rawTeacher.teacher || rawTeacher;
              const firstName = teacherObject.firstName || teacherObject.nombre || '';
              const lastName = teacherObject.lastName || teacherObject.apellido || '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
              return fullName || teacherObject.name || teacherObject.email || '';
            })
            .filter(Boolean);
        }
        teacherNames = [...new Set(teacherNames)];

        const estudiantePrincipal = studentNames.length > 0 ? studentNames[0] : 'Sin alumnos';
        const estudiantesExtras = studentNames.length > 1 ? `+${studentNames.length - 1}` : '';

        const docentePrincipal = teacherNames.length > 0 ? teacherNames[0] : 'Sin tutor asignado';
        const docentesExtras = teacherNames.length > 1 ? `+${teacherNames.length - 1}` : '';

        // Determinar estado contextual
        const rawEstado = String(projectData.estado || projectData.status || (projectItemCandidate.active ? 'En curso' : 'Pendiente')).toLowerCase();
        let estado: 'En curso' | 'Pendiente' | 'Finalizado' = 'En curso';
        let estadoClass: 'curso' | 'revision' | 'finalizado' = 'curso';

        if (rawEstado.includes('final') || rawEstado.includes('termin') || rawEstado.includes('aprob')) {
          estado = 'Finalizado';
          estadoClass = 'finalizado';
        } else if (rawEstado.includes('pend') || rawEstado.includes('revis')) {
          estado = 'Pendiente';
          estadoClass = 'revision';
        } else {
          estado = 'En curso';
          estadoClass = 'curso';
        }

        // Formatear última fecha registrada (priorizar lastTutoredAt de la entrega)
        const rawDate = work?.lastTutoredAt || projectData.lastTutoring || projectData.ultimaTutoria || projectData.updatedAt || projectData.createdAt || projectItemCandidate.updatedAt || projectItemCandidate.createdAt;
        let ultimaTutoria = '-';
        if (rawDate) {
          try {
            const parsedDate = new Date(rawDate);
            if (!isNaN(parsedDate.getTime())) {
              ultimaTutoria = parsedDate.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
            }
          } catch {}
        }

        return {
          id: projectId,
          proyecto: title,
          subtitulo: description,
          estudiantePrincipal: isStudent ? docentePrincipal : estudiantePrincipal,
          estudiantesExtras: isStudent ? docentesExtras : estudiantesExtras,
          estudiantesAsignados: studentNames,
          docentesAsignados: teacherNames,
          estado,
          estadoClass,
          ultimaTutoria,
          tutoringRequested,
          workId,
          rawProject: work
            ? { ...projectData, studentWork: projectData.studentWork || work }
            : projectData,
        };
      });

      setProjectsList(mapped);
    } catch (fetchError: any) {
      console.error('Error al cargar proyectos:', fetchError);
      setError(fetchError?.message || 'Error al conectar con el servidor para obtener los proyectos.');
      setProjectsList([]);
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects, refreshTrigger]);

  // Filtrado reactivo en memoria
  const filteredList = useMemo(() => {
    return projectsList.filter((itemCandidate) => {
      // Filtro por Estado
      if (filterEstado !== 'todos') {
        if (filterEstado === 'tutoria') {
          if (!itemCandidate.tutoringRequested) return false;
        } else if (itemCandidate.estado.toLowerCase() !== filterEstado.toLowerCase()) {
          return false;
        }
      }
      // Filtro por Texto de búsqueda
      if (searchQuery.trim()) {
        const normalizedQuery = searchQuery.toLowerCase().trim();
        const matchProyecto = itemCandidate.proyecto.toLowerCase().includes(normalizedQuery);
        const matchSubtitulo = itemCandidate.subtitulo.toLowerCase().includes(normalizedQuery);
        const matchMembers = [
          ...itemCandidate.estudiantesAsignados,
          ...itemCandidate.docentesAsignados,
        ].some((memberName) => memberName.toLowerCase().includes(normalizedQuery));
        if (!matchProyecto && !matchSubtitulo && !matchMembers) return false;
      }
      return true;
    });
  }, [projectsList, searchQuery, filterEstado]);

  // Restablecer la página a 1 ante cualquier cambio en los filtros
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterEstado]);

  // Cortar la lista de proyectos para paginación
  const paginatedList = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredList.slice(startIndex, startIndex + pageSize);
  }, [filteredList, page, pageSize]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterEstado('todos');
  };

  const summaryStats = useMemo(() => {
    const total = projectsList.length;
    const enCurso = projectsList.filter((p) => p.estado === 'En curso').length;
    const pendientes = projectsList.filter((p) => p.tutoringRequested).length;
    return { total, enCurso, pendientes };
  }, [projectsList]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ES';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  // Estudiante: un único TFI → ficha en lugar de tabla con filtros y paginación
  if (isStudent) {
    return (
      <MyTfiCard
        record={projectsList[0] ?? null}
        loading={loading}
        error={error}
        onRetry={fetchMyProjects}
      />
    );
  }

  return (
    <div className="projects-card-main">
      {/* Encabezado con resumen de actividad del tutor */}
      <div className="projects-header-row">
        <div className="projects-header">
          <div className="projects-header-icon-box">
            <FaFolderOpen size={22} />
          </div>
          <div>
            <h1 className="projects-header-title">Mis proyectos</h1>
            <p className="projects-header-subtitle">
              {isStudent
                ? 'Seguimiento de tus proyectos activos y estado de entregas.'
                : 'Seguimiento y gestión de los proyectos TFI que tenés a cargo.'}
            </p>
          </div>
        </div>

        <div className="tutor-header-metrics">
          <div className="tutor-metric-item">
            <span className="tutor-metric-value">{summaryStats.total}</span>
            <span className="tutor-metric-label">Total proyectos</span>
          </div>
          <div className="tutor-metric-item">
            <span className="tutor-metric-value success">{summaryStats.enCurso}</span>
            <span className="tutor-metric-label">En curso</span>
          </div>
          <div className="tutor-metric-item">
            <span className={`tutor-metric-value ${summaryStats.pendientes > 0 ? 'warning' : ''}`}>
              {summaryStats.pendientes}
            </span>
            <span className="tutor-metric-label">Solicitudes pendientes</span>
          </div>
        </div>
      </div>

      {/* Componente Reutilizable y Responsive de Filtros */}
      <TutorProjectFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterEstado={filterEstado}
        onEstadoChange={setFilterEstado}
        onClearFilters={handleClearFilters}
      />

      {/* Tabla Principal estilo Gestión de TFI */}
      <div className="projects-table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Proyecto</th>
              <th style={{ width: '20%' }}>{isStudent ? 'Docente / Tutor' : 'Estudiantes'}</th>
              <th style={{ width: '13%' }}>Estado</th>
              <th style={{ width: '17%' }}>Solicitud de tutoría</th>
              <th style={{ width: '12%' }}>Última tutoría</th>
              <th style={{ width: '10%', textAlign: 'right', paddingRight: '24px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <div className="text-secondary small mt-2">Cargando proyectos desde el servidor...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <div className="alert alert-warning d-inline-block text-start mb-0" style={{ maxWidth: '600px' }}>
                    <div className="fw-bold mb-1">No se pudieron cargar los proyectos</div>
                    <div className="small text-muted mb-2">{error}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={fetchMyProjects}
                    >
                      Reintentar
                    </button>
                  </div>
                </td>
              </tr>
            ) : paginatedList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-muted">
                  <div className="py-4">
                    <FaFolderOpen size={36} color="#cbd5e1" className="mb-2" />
                    <div className="fw-medium text-secondary">
                      {isStudent
                        ? 'No tenés proyectos asignados actualmente.'
                        : 'No se encontraron proyectos a cargo.'}
                    </div>
                    {isStudent && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate('/alumno/mis-proyectos?tab=all')}
                        >
                          Ver proyectos disponibles
                        </button>
                      </div>
                    )}
                    {(searchQuery || filterEstado !== 'todos') && (
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none text-danger mt-1 p-0"
                        onClick={handleClearFilters}
                      >
                        Limpiar filtros de búsqueda
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedList.map((projectRow) => (
                <tr key={projectRow.id}>
                  {/* Columna Proyecto: Título con link y descripción secundaria */}
                  <td>
                    <Link
                      to={`/proyectos/${projectRow.id}/trabajo?from=mis-proyectos`}
                      state={{ from: 'mis-proyectos' }}
                      className="projects-table-title-link"
                      title={projectRow.proyecto}
                    >
                      {projectRow.proyecto}
                    </Link>
                    <p className="project-description-text mb-1">{projectRow.subtitulo}</p>
                    {!isStudent && (
                      <div className="small text-secondary">
                        <strong>Docente/s asignado/s:</strong>{' '}
                        {projectRow.docentesAsignados.length > 0
                          ? projectRow.docentesAsignados.join(', ')
                          : 'Sin docente asignado'}
                      </div>
                    )}
                  </td>

                  {/* Columna Estudiantes / Docentes */}
                  <td>
                    {projectRow.estudiantePrincipal === 'Sin alumnos' ? (
                      <span className="empty-cell-muted">
                        <FaUserGroup size={12} />
                        <span>Sin estudiantes asignados</span>
                      </span>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <span className="tutor-student-avatar">
                          {getInitials(projectRow.estudiantePrincipal)}
                        </span>
                        <span className="projects-member-name">{projectRow.estudiantePrincipal}</span>
                        {projectRow.estudiantesExtras && (
                          <span className="badge bg-light text-secondary border">
                            {projectRow.estudiantesExtras}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Columna Estado del proyecto */}
                  <td>
                    <TutorProjectStatusPill
                      estado={projectRow.estado}
                      estadoClass={projectRow.estadoClass}
                    />
                  </td>

                  {/* Columna Solicitud de tutoría (separada del estado del proyecto) */}
                  <td>
                    {projectRow.tutoringRequested ? (
                      <span
                        className="tutor-request-pill pending"
                        title={isStudent ? 'Solicitaste una sesión de tutoría' : 'El equipo del proyecto solicitó una sesión de tutoría'}
                      >
                        <FaChalkboardUser size={11} />
                        <span>Tutoría solicitada</span>
                      </span>
                    ) : (
                      <span className="tutor-request-pill none">Sin solicitudes</span>
                    )}
                  </td>

                  {/* Columna Última Tutoría */}
                  <td className="text-secondary small">
                    {projectRow.ultimaTutoria !== '-' ? (
                      <div className="d-flex align-items-center gap-1">
                        <FaCalendarDays size={12} className="text-muted" />
                        <span>{projectRow.ultimaTutoria}</span>
                      </div>
                    ) : (
                      <span className="empty-cell-dash">—</span>
                    )}
                  </td>

                  {/* Columna Acciones */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-inline-flex align-items-center justify-content-end gap-2">
                      {!isStudent && projectRow.estado !== 'Finalizado' ? (
                        projectRow.tutoringRequested ? (
                          <button
                            type="button"
                            className="btn btn-sm teacher-btn-register-tutoria d-inline-flex align-items-center gap-1.5"
                            onClick={() =>
                              onOpenRegisterTutoring?.({
                                id: projectRow.id,
                                titulo: projectRow.proyecto,
                                workId: projectRow.workId,
                                studentName: projectRow.estudiantePrincipal,
                              })
                            }
                            title="Confirmar atención de la tutoría solicitada"
                          >
                            <FaGraduationCap size={13} />
                            <span>Confirmar tutoría</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                            disabled
                            style={{ opacity: 0.65, cursor: 'not-allowed' }}
                            title="No hay solicitud de tutoría pendiente para este proyecto"
                          >
                            <FaGraduationCap size={13} />
                            <span>Confirmar tutoría</span>
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm teacher-btn-view-outline"
                          onClick={() => navigate(`/proyectos/${projectRow.id}/trabajo?from=mis-proyectos`, { state: { from: 'mis-proyectos' } })}
                        >
                          Ver proyecto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Espaciador flexible para empujar la paginación al pie del card */}
      <div style={{ flexGrow: 1 }} />

      {/* Paginación estilo Gestión de TFI */}
      {filteredList.length > 0 && (() => {
        const totalItems = filteredList.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const startItem = (page - 1) * pageSize + 1;
        const endItem = Math.min(page * pageSize, totalItems);
        return (
          <div className="projects-pagination-footer">
            <div className="projects-pagination-info">
              <span>
                Mostrando {startItem} - {endItem} de {totalItems} proyectos
              </span>
              <div className="d-flex align-items-center gap-2">
                <span>Mostrar:</span>
                <select
                  className="projects-select"
                  style={{ padding: '4px 28px 4px 10px', fontSize: '0.82rem' }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt} por pág.
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="projects-pagination-controls">
              <button
                type="button"
                className="projects-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`projects-page-btn ${page === pageNum ? 'active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="projects-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                &gt;
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default TutorProjectsTable;

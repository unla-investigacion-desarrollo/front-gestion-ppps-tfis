import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFolderOpen, FaCalendarDays, FaEllipsisVertical } from 'react-icons/fa6';
import { projectService } from '../../../../services/projectService';
import Pagination from '../../../../components/Pagination';
import TutorProjectFilters from './TutorProjectFilters';
import TutorProjectStatusPill from './TutorProjectStatusPill';

// Importar estilos compartidos del módulo de gestión de proyectos
import '../../../Teacher/TeacherProjectsList.css';

export interface TutorProjectRecord {
  id: string;
  proyecto: string;
  subtitulo: string;
  estudiantePrincipal: string;
  estudiantesExtras: string;
  estado: 'En curso' | 'Pendiente' | 'Finalizado';
  estadoClass: 'curso' | 'revision' | 'finalizado';
  ultimaTutoria: string;
  rawProject?: any;
}

interface TutorProjectsTableProps {
  onBackToInicio: () => void;
  onOpenRegisterTutoring: (project: { id: string | number; titulo: string }) => void;
}

/**
 * Componente que renderiza el listado de "Mis proyectos" a cargo del Profesor Tutor.
 * Reutiliza el diseño visual, componentes compartidos (Filtros, Paginación, Badges)
 * y el sistema de grid responsive de Bootstrap implementado en la gestión de proyectos.
 */
export const TutorProjectsTable: React.FC<TutorProjectsTableProps> = ({
  onBackToInicio,
  onOpenRegisterTutoring,
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
  const [pageSize, setPageSize] = useState<number>(5);

  // Obtener proyectos asignados activamente al tutor desde el backend
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

      const mapped: TutorProjectRecord[] = list.map((item: any) => {
        const projectData = item.project || item;
        const projectId = String(projectData.id || item.id || '');
        const title = projectData.title || projectData.titulo || 'Proyecto sin título';
        const description = projectData.description || projectData.descripcion || 'Sin descripción';

        // Extraer alumnos asignados al proyecto
        let studentNames: string[] = [];
        const rawStudents = projectData.activeStudents || projectData.students || projectData.users || [];
        if (Array.isArray(rawStudents)) {
          studentNames = rawStudents
            .map((rawStudent: any) => {
              if (!rawStudent) return '';
              if (typeof rawStudent === 'string') return rawStudent;
              const studentObject = rawStudent.student || rawStudent.user || rawStudent;
              const firstName = studentObject.firstName || studentObject.nombre || '';
              const lastName = studentObject.lastName || studentObject.apellido || '';
              const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
              return fullName || studentObject.name || studentObject.email || '';
            })
            .filter(Boolean);
        }

        const estudiantePrincipal = studentNames.length > 0 ? studentNames[0] : 'Sin asignar';
        const estudiantesExtras = studentNames.length > 1 ? `+${studentNames.length - 1}` : '';

        // Determinar estado contextual
        const rawEstado = String(projectData.estado || projectData.status || (item.active ? 'En curso' : 'Pendiente')).toLowerCase();
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

        // Formatear última fecha registrada
        const rawDate = projectData.lastTutoring || projectData.ultimaTutoria || projectData.updatedAt || projectData.createdAt || item.updatedAt || item.createdAt;
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
          estudiantePrincipal,
          estudiantesExtras,
          estado,
          estadoClass,
          ultimaTutoria,
          rawProject: projectData,
        };
      });

      setProjectsList(mapped);
    } catch (err: any) {
      console.error('Error al cargar proyectos del docente:', err);
      setError(err?.message || 'Error al conectar con el servidor para obtener los proyectos.');
      setProjectsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  // Filtrado reactivo en memoria
  const filteredList = useMemo(() => {
    return projectsList.filter((item) => {
      // Filtro por Estado
      if (filterEstado !== 'todos' && item.estado.toLowerCase() !== filterEstado.toLowerCase()) {
        return false;
      }
      // Filtro por Texto de búsqueda
      if (searchQuery.trim()) {
        const normalizedQuery = searchQuery.toLowerCase().trim();
        const matchProyecto = item.proyecto.toLowerCase().includes(normalizedQuery);
        const matchSubtitulo = item.subtitulo.toLowerCase().includes(normalizedQuery);
        const matchEstudiante = item.estudiantePrincipal.toLowerCase().includes(normalizedQuery);
        if (!matchProyecto && !matchSubtitulo && !matchEstudiante) return false;
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

  return (
    <div className="projects-card-main">
      {/* Breadcrumb de navegación */}
      <div className="mb-2">
        <button
          type="button"
          className="teacher-breadcrumb border-0 bg-transparent p-0 d-inline-flex align-items-center gap-2 text-muted"
          onClick={onBackToInicio}
          style={{ cursor: 'pointer', fontSize: '13.5px' }}
        >
          <FaArrowLeft size={11} />
          <span>Inicio</span>
        </button>
      </div>

      {/* Encabezado con estilo institucional unificado */}
      <div className="mb-4">
        <h1 className="projects-title m-0">Mis proyectos</h1>
        <p className="projects-subtitle text-muted m-0">
          Seguimiento de los proyectos que tenés a cargo.
        </p>
      </div>

      {/* Componente Reutilizable y Responsive de Filtros */}
      <TutorProjectFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterEstado={filterEstado}
        onEstadoChange={setFilterEstado}
        onClearFilters={handleClearFilters}
      />

      {/* Tabla Principal con Responsive Bootstrap Wrapper */}
      <div className="projects-table-wrapper table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col" style={{ width: '32%' }}>PROYECTO</th>
              <th scope="col" style={{ width: '22%' }}>ESTUDIANTES</th>
              <th scope="col" style={{ width: '16%' }}>ESTADO</th>
              <th scope="col" style={{ width: '16%' }}>ÚLTIMA TUTORÍA</th>
              <th scope="col" style={{ width: '14%', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-5">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <div className="text-secondary small mt-2">Cargando proyectos desde el servidor...</div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
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
                <td colSpan={5} className="text-center py-5 text-muted">
                  <div className="py-4">
                    <FaFolderOpen size={36} color="#cbd5e1" className="mb-2" />
                    <div className="fw-medium text-secondary">No se encontraron proyectos a cargo.</div>
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
              paginatedList.map((row) => (
                <tr key={row.id}>
                  {/* Columna Proyecto: Título con link y descripción secundaria */}
                  <td>
                    <Link
                      to={`/proyectos/${row.id}/trabajo`}
                      className="project-title-link"
                      title={row.proyecto}
                    >
                      {row.proyecto}
                    </Link>
                    <p className="project-description-text mb-0">{row.subtitulo}</p>
                  </td>

                  {/* Columna Estudiantes: Alumno principal y badge extra */}
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-medium text-dark">{row.estudiantePrincipal}</span>
                      {row.estudiantesExtras && (
                        <span className="badge bg-light text-secondary border">
                          {row.estudiantesExtras}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Columna Estado: Pill reutilizable */}
                  <td>
                    <TutorProjectStatusPill
                      estado={row.estado}
                      estadoClass={row.estadoClass}
                    />
                  </td>

                  {/* Columna Última Tutoría */}
                  <td className="text-secondary small">
                    {row.ultimaTutoria !== '-' ? (
                      <div className="d-flex align-items-center gap-1">
                        <FaCalendarDays size={12} className="text-muted" />
                        <span>{row.ultimaTutoria}</span>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>

                  {/* Columna Acciones */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="d-inline-flex align-items-center justify-content-end gap-2">
                      {row.estado !== 'Finalizado' ? (
                        <button
                          type="button"
                          className="btn btn-sm teacher-btn-register-tutoria"
                          onClick={() =>
                            onOpenRegisterTutoring({
                              id: row.id,
                              titulo: row.proyecto,
                            })
                          }
                        >
                          Registrar tutoría
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm teacher-btn-view-outline"
                          onClick={() => navigate(`/proyectos/${row.id}/trabajo`)}
                        >
                          Ver proyecto
                        </button>
                      )}

                      <button
                        type="button"
                        className="teacher-btn-more-actions d-inline-flex align-items-center justify-content-center"
                        title="Opciones"
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('toast', {
                              detail: {
                                message: `Detalles del proyecto ${row.proyecto}`,
                                type: 'info',
                              },
                            })
                          );
                        }}
                      >
                        <FaEllipsisVertical size={13} />
                      </button>
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

      {/* Componente Reutilizable de Paginación */}
      {filteredList.length > 0 && (
        <Pagination
          currentPage={page}
          totalItems={filteredList.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[5, 10, 20]}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      )}
    </div>
  );
};

export default TutorProjectsTable;

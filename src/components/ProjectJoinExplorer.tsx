import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { projectService } from '../services/projectService';
import { showToast } from '../utils/toast';
import './ProjectJoinExplorer.css';

export interface ProjectJoinExplorerProps {
  onJoinSuccess?: (projectId: number | string) => void;
  title?: string;
  subtitle?: string;
}

interface ProjectItem {
  id: number | string;
  title?: string;
  titulo?: string;
  description?: string;
  descripcion?: string;
  status?: string;
  estado?: string;
  projectType?: { id: number; name: string };
  categoria?: string;
  students?: any[];
  activeStudents?: any[];
}

interface RequestItem {
  id: number;
  active: boolean;
  project: {
    id: number;
    title: string;
    description: string;
    status: string;
    projectType?: { id: number; name: string };
  };
}

export const ProjectJoinExplorer: React.FC<ProjectJoinExplorerProps> = ({
  onJoinSuccess,
  title = 'Proyectos Disponibles',
  subtitle = 'Explorá proyectos existentes y postulate para participar.',
}) => {
  const currentUser = useSelector(selectCurrentUser) as any;
  const token = localStorage.getItem('token') || '';

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'active'>('all');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [myActiveProjects, setMyActiveProjects] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Identificar si el usuario actual es Docente Tutor o Estudiante
  const roles = Array.isArray(currentUser?.roles)
    ? currentUser.roles
    : currentUser?.roles
    ? [currentUser.roles]
    : [];
  const isTeacher = roles.some((r: string) =>
    ['DOCENTE', 'TEACHER', 'PROFESSOR'].includes(String(r).toUpperCase().trim())
  );

  // Cargar datos del backend
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [allProjData, requestsData, activeProjData] = await Promise.all([
        projectService.getProjects(token),
        projectService.getMyRequests(token),
        projectService.getMyActiveProjects(token),
      ]);

      setProjects(Array.isArray(allProjData) ? allProjData : []);
      setMyRequests(Array.isArray(requestsData) ? requestsData : []);
      setMyActiveProjects(Array.isArray(activeProjData) ? activeProjData : []);
    } catch (err: any) {
      console.error('Error cargando proyectos del usuario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // IDs de proyectos con solicitud pendiente
  const pendingProjectIds = useMemo(() => {
    return new Set(myRequests.map((r) => String(r.project?.id)));
  }, [myRequests]);

  // IDs de proyectos activos / aprobados
  const activeProjectIds = useMemo(() => {
    return new Set(myActiveProjects.map((r) => String(r.project?.id)));
  }, [myActiveProjects]);

  // Manejar solicitud de unirse al proyecto
  const handleJoinProject = async (projectId: number | string, projectTitle: string) => {
    if (!token) {
      showToast('Sesión no válida o expirada', 'error');
      return;
    }

    setRequestingId(projectId);
    try {
      if (isTeacher) {
        // Postulación como docente tutor
        await projectService.requestJoinAsProfessor(projectId, token);
      } else {
        // Postulación como alumno
        await projectService.requestJoinAsStudent(projectId, token);
      }

      showToast(`¡Solicitud enviada para "${projectTitle}"! Pendiente de aprobación.`, 'success');
      if (onJoinSuccess) {
        onJoinSuccess(projectId);
      }
      // Recargar solicitudes para actualizar el botón en tiempo real
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Error al enviar solicitud al proyecto', 'error');
    } finally {
      setRequestingId(null);
    }
  };

  // Filtrado por buscador
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const title = (p.title || p.titulo || '').toLowerCase();
      const desc = (p.description || p.descripcion || '').toLowerCase();
      const type = (p.projectType?.name || p.categoria || '').toLowerCase();
      return title.includes(q) || desc.includes(q) || type.includes(q);
    });
  }, [projects, searchQuery]);

  return (
    <div className="project-join-container">
      <div className="project-join-header">
        <h2 className="project-join-title">{title}</h2>
        <p className="project-join-subtitle">{subtitle}</p>
      </div>

      {/* Selector de pestañas */}
      <div className="project-join-tabs">
        <button
          type="button"
          className={`project-join-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Explorar Proyectos
          <span className="project-join-tab-badge">{projects.length}</span>
        </button>

        <button
          type="button"
          className={`project-join-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Mis Solicitudes Pendientes
          {myRequests.length > 0 && (
            <span className="project-join-tab-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              {myRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`project-join-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Mis Proyectos Activos
          <span className="project-join-tab-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            {myActiveProjects.length}
          </span>
        </button>
      </div>

      {/* Pestaña: Todos los proyectos (Explorador) */}
      {activeTab === 'all' && (
        <>
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por título, temática o tipo de proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '450px' }}
            />
          </div>

          {loading ? (
            <div className="project-join-empty">Cargando proyectos disponibles...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="project-join-empty">No se encontraron proyectos disponibles en el sistema.</div>
          ) : (
            <div className="project-join-grid">
              {filteredProjects.map((p) => {
                const strId = String(p.id);
                const isApproved = activeProjectIds.has(strId);
                const isPending = pendingProjectIds.has(strId);
                const isRequesting = requestingId === p.id;
                const projectTitle = p.title || p.titulo || 'Proyecto';
                const typeName = p.projectType?.name || p.categoria || 'General';

                return (
                  <div key={p.id} className="project-card-item">
                    <div>
                      <div className="project-card-header">
                        <h3 className="project-card-title">{projectTitle}</h3>
                        <span className="badge bg-secondary">{typeName}</span>
                      </div>

                      <p className="project-card-desc">
                        {p.description || p.descripcion || 'Sin descripción detallada.'}
                      </p>
                    </div>

                    <div className="project-card-footer">
                      {isApproved ? (
                        <span className="badge-status-approved">
                          ✓ Asignado y Activo
                        </span>
                      ) : isPending ? (
                        <span className="badge-status-pending">
                          ⏳ Solicitud enviada (Pendiente)
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-join-project"
                          disabled={isRequesting}
                          onClick={() => handleJoinProject(p.id, projectTitle)}
                        >
                          {isRequesting ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <span>+</span> Solicitar unirse
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pestaña: Mis Solicitudes Pendientes */}
      {activeTab === 'requests' && (
        <div>
          {myRequests.length === 0 ? (
            <div className="project-join-empty">
              No tenés solicitudes pendientes de aprobación en este momento.
            </div>
          ) : (
            <div className="project-join-grid">
              {myRequests.map((req) => (
                <div key={req.id} className="project-card-item">
                  <div>
                    <div className="project-card-header">
                      <h3 className="project-card-title">{req.project?.title}</h3>
                      <span className="badge bg-warning text-dark">Pendiente</span>
                    </div>
                    <p className="project-card-desc">{req.project?.description}</p>
                  </div>
                  <div className="project-card-footer">
                    <span className="badge-status-pending">
                      ⏳ A la espera de aprobación del docente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Mis Proyectos Activos */}
      {activeTab === 'active' && (
        <div>
          {myActiveProjects.length === 0 ? (
            <div className="project-join-empty">
              Aún no estás asignado activamente a ningún proyecto aprobado.
            </div>
          ) : (
            <div className="project-join-grid">
              {myActiveProjects.map((act) => (
                <div key={act.id} className="project-card-item">
                  <div>
                    <div className="project-card-header">
                      <h3 className="project-card-title">{act.project?.title}</h3>
                      <span className="badge bg-success">Activo</span>
                    </div>
                    <p className="project-card-desc">{act.project?.description}</p>
                  </div>
                  <div className="project-card-footer">
                    <span className="badge-status-approved">
                      ✓ Participando activamente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectJoinExplorer;

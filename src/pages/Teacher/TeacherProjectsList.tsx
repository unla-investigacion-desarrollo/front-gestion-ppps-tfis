import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

// Redux Actions & Selectors
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { normalizeRoles } from '../../redux/features/auth/asyncActions';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  fetchProjects,
  fetchProjectTypes,
  updateProject,
  deleteProject,
  removeStudentFromProject,
  removeCoTeacher,
  selectProjects,
  selectProjectTypes,
  Project,
  normalizeBackendProject,
} from '../../../redux/slices/projectsSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';

// Reusable Components
import ProjectFilters, { ProjectFiltersState } from './components/ProjectFilters';
import ProjectTable from './components/ProjectTable';
import {
  ActivityModal,
  EditProjectModal,
  Activity
} from './components/ProjectModals';

// Styles & Assets
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaGraduationCap, FaTriangleExclamation } from 'react-icons/fa6';
import './TeacherProjectsList.css';
import { projectService } from '../../services/projectService';

// Constante para la clave de almacenamiento local de actividad
const ACTIVITY_STORAGE_KEY = 'projectActivity';

/**
 * Componente Principal para la Gestión de Proyectos por parte del Docente.
 * Orquesta la carga de proyectos desde la base de datos, filtros avanzados, paginación,
 * y controla los modales de actividad, asignación, colaboración y edición de proyectos.
 */
const TeacherProjectsList: React.FC = () => {
  const dispatch = useDispatch<any>();

  // --- SELECTORES DE REDUX ---
  const currentUser = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjects);
  const projectTypes = useSelector(selectProjectTypes);
  const users = useSelector(selectUsers);

  // Determinar si el usuario actual tiene rol de Tutor desde la BD
  const { isTutor: userIsTutor, isProfessor } = useUserProfile();
  const isTutor = Boolean(currentUser?.isTutor ?? userIsTutor);

  // Determinar si el usuario actual es ADMIN o SUPERADMIN
  const isAdminOrSuperAdmin = useMemo(() => {
    const roles = normalizeRoles([
      ...(Array.isArray(currentUser?.roles)
        ? currentUser.roles
        : currentUser?.roles
          ? [currentUser.roles]
          : []),
      (currentUser as any)?.role,
      (currentUser as any)?.rol,
    ]);
    return roles.includes('ADMIN') || roles.includes('SUPERADMIN');
  }, [currentUser]);

  // --- FILTROS Y ESTADO DE PAGINACIÓN ---
  const [filters, setFilters] = useState<ProjectFiltersState>({ q: '', categoria: 'ALL', alumnos: 'ALL' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // --- ESTADO DE CONTROL DE MODALES ---
  const [activeActivityProject, setActiveActivityProject] = useState<Project | null>(null);
  const [activeEditProject, setActiveEditProject] = useState<Project | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{
    projectId: string;
    memberId: string;
    type: 'student' | 'professor';
  } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // --- SOLICITUDES Y PROYECTOS ACTIVOS DEL USUARIO ---
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myActiveProjects, setMyActiveProjects] = useState<any[]>([]);

  // --- CARGA INICIAL DESDE LA BASE DE DATOS ---
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchProjectTypes());
    dispatch(fetchUsers());

    const token = localStorage.getItem('token') || '';
    if (token && isTutor) {
      projectService
        .getMyRequests(token)
        .then((data) => setMyRequests(Array.isArray(data) ? data : []))
        .catch(() => {});

      projectService
        .getMyActiveProjects(token)
        .then((data) => setMyActiveProjects(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [dispatch, isTutor]);

  const pendingProjectIds = useMemo(() => {
    return new Set(myRequests.map((req) => String(req.project?.id || req.id)));
  }, [myRequests]);

  const activeProjectIds = useMemo(() => {
    return new Set(myActiveProjects.map((ap) => String(ap.project?.id || ap.id)));
  }, [myActiveProjects]);

  const handleRequestJoin = async (project: Project) => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: 'Sesión no válida o expirada', type: 'error' },
        })
      );
      return;
    }

    try {
      await projectService.requestJoinAsProfessor(project.id, token);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: `¡Solicitud enviada para "${project.titulo}"! Pendiente de aprobación.`,
            type: 'success',
          },
        })
      );
      const updated = await projectService.getMyRequests(token);
      setMyRequests(Array.isArray(updated) ? updated : []);
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: err?.message || 'Error al enviar solicitud al proyecto',
            type: 'error',
          },
        })
      );
    }
  };

  // Restablecer la página a 1 cuando cambian los criterios de búsqueda o filtrado
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // --- PROCESAMIENTO Y FILTRADO DE DATOS ---

  // Enriquecer proyectos con las relaciones completas de los proyectos activos del docente
  const enrichedProjects = useMemo(() => {
    const activeMap = new Map<string, any>();
    myActiveProjects.forEach((item: any) => {
      const proj = item.project || item;
      const id = String(proj.id || item.id || '');
      if (id) {
        activeMap.set(id, {
          ...proj,
          activeStudents:
            proj.activeStudents && proj.activeStudents.length > 0
              ? proj.activeStudents
              : item.activeStudents || [],
          activeProfessors:
            proj.activeProfessors && proj.activeProfessors.length > 0
              ? proj.activeProfessors
              : item.activeProfessors || [],
          professor: item.professor,
        });
      }
    });

    const existingIds = new Set<string>();

    const baseEnriched = projects.map((project) => {
      existingIds.add(String(project.id));
      const activeData = activeMap.get(String(project.id));
      if (!activeData) return project;

      const mergedActiveStudents =
        activeData.activeStudents && activeData.activeStudents.length > 0
          ? activeData.activeStudents
          : project.activeStudents || [];

      const mergedActiveProfessors =
        activeData.activeProfessors && activeData.activeProfessors.length > 0
          ? activeData.activeProfessors
          : project.activeProfessors || [];

      // Extraer IDs de estudiantes resueltos
      const rawStudentsList =
        mergedActiveStudents.length > 0 ? mergedActiveStudents : project.students || [];

      const resolvedStudents = rawStudentsList
        .filter((as: any) => as && as.active !== false)
        .map((as: any) => {
          const sObj = as.student?.user || as.user || as.student || as;
          return String(sObj.id || as.student?.id_user || as.student?.id || as.id_user || as.id || '');
        })
        .filter(Boolean);

      return {
        ...project,
        activeStudents: mergedActiveStudents,
        students: resolvedStudents.length > 0 ? resolvedStudents : project.students,
        activeProfessors: mergedActiveProfessors,
        raw: {
          ...(project.raw || {}),
          ...activeData,
        },
      };
    });

    // Si existen proyectos activos que no vinieron en la lista general, agregarlos
    const additional: Project[] = [];
    myActiveProjects.forEach((item: any) => {
      const proj = item.project || item;
      const id = String(proj.id || item.id || '');
      if (id && !existingIds.has(id)) {
        existingIds.add(id);
        const norm = normalizeBackendProject({
          ...proj,
          activeStudents:
            proj.activeStudents && proj.activeStudents.length > 0
              ? proj.activeStudents
              : item.activeStudents || [],
          activeProfessors:
            proj.activeProfessors && proj.activeProfessors.length > 0
              ? proj.activeProfessors
              : item.activeProfessors || (item.professor ? [{ active: true, professor: item.professor }] : []),
        });
        additional.push(norm);
      }
    });

    return [...baseEnriched, ...additional];
  }, [projects, myActiveProjects]);

  // Filtrado y ordenamiento de proyectos (los más recientes primero)
  const filteredProjects = useMemo(() => {
    const list = enrichedProjects.filter((project) => {
      // 1. Filtro por buscador (Título y Descripción)
      const searchQuery = filters.q.trim().toLowerCase();
      const matchesSearch =
        !searchQuery ||
        project.titulo.toLowerCase().includes(searchQuery) ||
        project.descripcion.toLowerCase().includes(searchQuery);

      // 2. Filtro por Categoría / Tipo de Proyecto
      const matchesCategory =
        filters.categoria === 'ALL' ||
        (project.categoria && project.categoria.toLowerCase() === filters.categoria.toLowerCase()) ||
        (project.projectType?.name && project.projectType.name.toLowerCase() === filters.categoria.toLowerCase()) ||
        (project.projectTypeId && String(project.projectTypeId) === String(filters.categoria));

      // 3. Filtro por Cantidad/Estado de Alumnos Asignados
      const assignedCount = project.students.length;
      let matchesStudents = true;
      if (filters.alumnos === 'NONE') {
        matchesStudents = assignedCount === 0;
      } else if (filters.alumnos === 'SOME') {
        matchesStudents = assignedCount > 0 && assignedCount < 5;
      } else if (filters.alumnos === 'FULL') {
        matchesStudents = assignedCount === 5;
      }

      return matchesSearch && matchesCategory && matchesStudents;
    });

    // Ordenar de forma descendente: proyectos más recientes primero
    return list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [enrichedProjects, filters]);

  // Cálculo de total de páginas y ajuste automático de rango
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Cortar la lista filtrada de proyectos según la página actual
  const paginatedProjects = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, page, pageSize]);

  // --- HISTORIAL DE ACTIVIDAD (LOCALSTORAGE) ---

  // Leer la actividad del proyecto desde el almacenamiento local
  const readActivityMap = (): Record<string, Activity[]> => {
    try {
      const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  // Guardar el mapa de actividad de vuelta al almacenamiento local
  const writeActivityMap = (activityMap: Record<string, Activity[]>) => {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activityMap));
  };

  // Agregar una nueva entrada de actividad
  const handleAppendActivity = (newEntry: Activity) => {
    const activityMap = readActivityMap();
    const existingList = Array.isArray(activityMap[newEntry.projectId]) ? activityMap[newEntry.projectId] : [];
    activityMap[newEntry.projectId] = [...existingList, newEntry];
    writeActivityMap(activityMap);

    // Forzar re-renderizado del modal al actualizar el mapa
    if (activeActivityProject) {
      setActiveActivityProject({ ...activeActivityProject });
    }
  };

  // --- MANEJADORES DE ACCIONES ---

  // Quitar alumno del proyecto
  const handleRemoveStudent = (projectId: string, studentId: string) => {
    setMemberToRemove({ projectId, memberId: studentId, type: 'student' });
  };

  // Quitar co-docente
  const handleRemoveCoTeacher = (projectId: string, teacherId: string) => {
    setMemberToRemove({ projectId, memberId: teacherId, type: 'professor' });
  };

  const handleConfirmMemberRemoval = async () => {
    if (!memberToRemove || isRemovingMember) return;

    setIsRemovingMember(true);
    try {
      const isStudent = memberToRemove.type === 'student';
      const response = await dispatch(
        isStudent
          ? removeStudentFromProject({
              projectId: memberToRemove.projectId,
              studentId: memberToRemove.memberId,
            })
          : removeCoTeacher({
              projectId: memberToRemove.projectId,
              teacherId: memberToRemove.memberId,
            })
      );
      const hasError = Boolean((response as any).error);

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: hasError
              ? (response as any).payload || `Error al quitar el ${isStudent ? 'alumno' : 'co-docente'}`
              : `${isStudent ? 'Alumno' : 'Co-docente'} quitado del proyecto`,
            type: hasError ? 'error' : 'success',
          },
        })
      );
      setMemberToRemove(null);
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Guardar modificaciones del proyecto en la base de datos y recargar Redux
  const handleSaveProjectEdit = async (
    titulo: string,
    descripcion: string,
    projectTypeId?: number
  ) => {
    if (!activeEditProject) return;
    const response = await dispatch(
      updateProject({
        projectId: activeEditProject.id,
        titulo,
        descripcion,
        projectTypeId,
      })
    );

    if (!(response as any).error) {
      try {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Proyecto modificado correctamente', type: 'success' } })
        );
      } catch { }
    } else {
      try {
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: {
              message: (response as any).payload || 'Error al modificar el proyecto',
              type: 'error',
            },
          })
        );
      } catch { }
    }
  };

  // Eliminar proyecto (solo ADMIN y SUPERADMIN)
  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleConfirmProjectDeletion = async () => {
    if (!projectToDelete || isDeletingProject) return;

    setIsDeletingProject(true);
    try {
      const response = await dispatch(deleteProject({ projectId: String(projectToDelete.id) }));
      const hasError = Boolean((response as any).error);

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: {
            message: hasError
              ? (response as any).payload || 'Error al eliminar el proyecto'
              : 'Proyecto eliminado exitosamente',
            type: hasError ? 'error' : 'success',
          },
        })
      );
      setProjectToDelete(null);
    } finally {
      setIsDeletingProject(false);
    }
  };



  // Restablecer filtros a su estado inicial
  const handleClearAllFilters = () => {
    setFilters({ q: '', categoria: 'ALL', alumnos: 'ALL' });
  };

  return (
    <div className="projects-page-container">
      <div className="projects-card-main">
        {/* Cabecera principal estilo Solicitudes */}
        <div className="projects-header-row">
          <div className="projects-header">
            <div className="projects-header-icon-box">
              <FaGraduationCap size={24} />
            </div>
            <div>
              <h1 className="projects-header-title">Gestión de TFI</h1>
              <p className="projects-header-subtitle">
                {isTutor
                  ? 'Convocatoria de proyectos disponibles para solicitar unirse como profesor tutor.'
                  : 'Gestioná y colaborá en los proyectos.'}
              </p>
            </div>
          </div>
          {!isTutor && (
            <div className="d-flex gap-2">
              <Link className="btn-new-project" to="/docente/proyectos/nuevo">
                <span>+</span> Nuevo Proyecto TFI
              </Link>
            </div>
          )}
        </div>

        {/* Sección de Filtros de Búsqueda */}
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearAllFilters}
          projectTypes={projectTypes}
        />

        {/* Listado principal: Tabla de Proyectos */}
        <ProjectTable
          projects={paginatedProjects}
          users={users}
          isTutor={isTutor}
          canRemoveProjectMembers={isAdminOrSuperAdmin || (isProfessor && !isTutor)}
          canDeleteProject={isAdminOrSuperAdmin}
          onRemoveStudent={handleRemoveStudent}
          onRemoveCoTeacher={handleRemoveCoTeacher}
          onActivityClick={(project) => setActiveActivityProject(project)}
          onEditClick={(project) => setActiveEditProject(project)}
          onDeleteClick={isAdminOrSuperAdmin ? handleDeleteProject : undefined}
          onRequestJoinClick={isTutor ? handleRequestJoin : undefined}
          pendingProjectIds={pendingProjectIds}
          activeProjectIds={activeProjectIds}
        />

        {/* Espaciador flexible para empujar la paginación al fondo */}
        <div style={{ flexGrow: 1 }} />

        {/* Paginación de Proyectos estilo Solicitudes */}
        {filteredProjects.length > 0 && (() => {
          const totalItems = filteredProjects.length;
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

      {/* --- MODAL PARA ACTIVIDAD DEL PROYECTO --- */}
      {activeActivityProject && (
        <ActivityModal
          project={activeActivityProject}
          currentUserId={currentUser?.id || ''}
          users={users}
          onClose={() => setActiveActivityProject(null)}
          readActivity={readActivityMap}
          appendActivity={handleAppendActivity}
        />
      )}



      {/* --- MODAL PARA EDITAR DETALLES DEL PROYECTO --- */}
      {activeEditProject && (
        <EditProjectModal
          project={activeEditProject}
          projectTypes={projectTypes}
          onClose={() => setActiveEditProject(null)}
          onSave={handleSaveProjectEdit}
        />
      )}

      {memberToRemove && (
        <>
          <div
            className="modal fade show custom-modal-dialog-wrapper"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-member-title"
          >
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 id="remove-member-title" className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary, #64001d)' }}>
                    Quitar integrante del proyecto
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMemberToRemove(null)}
                    aria-label="Cerrar"
                    disabled={isRemovingMember}
                  />
                </div>
                <div className="modal-body custom-modal-body text-center py-4">
                  <FaTriangleExclamation size={44} color="var(--unla-primary, #64001d)" className="mb-3" />
                  <p className="mb-0" style={{ fontSize: '17px', fontWeight: 500 }}>
                    ¿Seguro que querés quitar a este {memberToRemove.type === 'student' ? 'alumno' : 'co-docente'}?
                  </p>
                  <p className="text-muted small mt-2 mb-0">
                    Dejará de formar parte del proyecto.
                  </p>
                </div>
                <div className="modal-footer custom-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setMemberToRemove(null)}
                    disabled={isRemovingMember}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmMemberRemoval}
                    disabled={isRemovingMember}
                  >
                    {isRemovingMember ? 'Quitando...' : 'Quitar integrante'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="custom-modal-backdrop" />
        </>
      )}

      {projectToDelete && (
        <>
          <div
            className="modal fade show custom-modal-dialog-wrapper"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
          >
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content custom-modal-content">
                <div className="modal-header custom-modal-header">
                  <h5 id="delete-project-title" className="modal-title" style={{ fontWeight: 600, color: 'var(--unla-primary, #64001d)' }}>
                    Confirmar eliminación
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setProjectToDelete(null)}
                    aria-label="Cerrar"
                    disabled={isDeletingProject}
                  />
                </div>
                <div className="modal-body custom-modal-body text-center py-4">
                  <FaTriangleExclamation size={44} color="var(--unla-primary, #64001d)" className="mb-3" />
                  <p className="mb-0" style={{ fontSize: '17px', fontWeight: 500 }}>
                    ¿Seguro que querés eliminar el proyecto <strong>{projectToDelete.titulo}</strong>?
                  </p>
                  <p className="text-muted small mt-2 mb-0">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="modal-footer custom-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setProjectToDelete(null)}
                    disabled={isDeletingProject}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmProjectDeletion}
                    disabled={isDeletingProject}
                  >
                    {isDeletingProject ? 'Eliminando...' : 'Eliminar proyecto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="custom-modal-backdrop" />
        </>
      )}
    </div>
  );
};

export default TeacherProjectsList;

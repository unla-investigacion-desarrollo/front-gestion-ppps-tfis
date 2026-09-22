import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

// Redux Actions & Selectors
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  fetchProjects,
  fetchProjectTypes,
  updateProject,
  removeStudentFromProject,
  removeCoTeacher,
  selectProjects,
  selectProjectTypes,
  Project,
  normalizeBackendProject,
} from '../../../redux/slices/projectsSlice';
import { fetchUsers, selectUsers } from '../../../redux/slices/usersSlice';

// Reusable Components
import Pagination from '../../components/Pagination';
import ProjectFilters, { ProjectFiltersState } from './components/ProjectFilters';
import ProjectTable from './components/ProjectTable';
import {
  ActivityModal,
  EditProjectModal,
  Activity
} from './components/ProjectModals';

// Styles & Assets
import 'bootstrap/dist/css/bootstrap.min.css';
import bgImage from '../../assets/fondo-rojo.jpg';
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
  const { isTutor: userIsTutor } = useUserProfile();
  const isTutor = Boolean(currentUser?.isTutor ?? userIsTutor);

  // --- FILTROS Y ESTADO DE PAGINACIÓN ---
  const [filters, setFilters] = useState<ProjectFiltersState>({ q: '', categoria: 'ALL', alumnos: 'ALL' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // --- ESTADO DE CONTROL DE MODALES ---
  const [activeActivityProject, setActiveActivityProject] = useState<Project | null>(null);
  const [activeEditProject, setActiveEditProject] = useState<Project | null>(null);

  // --- SOLICITUDES Y PROYECTOS ACTIVOS DEL USUARIO ---
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myActiveProjects, setMyActiveProjects] = useState<any[]>([]);

  // --- CARGA INICIAL DESDE LA BASE DE DATOS ---
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchProjectTypes());
    dispatch(fetchUsers());

    const token = localStorage.getItem('token') || '';
    if (token) {
      projectService
        .getMyRequests(token)
        .then((data) => setMyRequests(Array.isArray(data) ? data : []))
        .catch(() => {});

      projectService
        .getMyActiveProjects(token)
        .then((data) => setMyActiveProjects(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [dispatch]);

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

  // Obtener alumnos activos del sistema para la asignación
  const activeStudents = useMemo(() => {
    return users.filter((user) => user.rol === 'ESTUDIANTE' && user.estado === 'active');
  }, [users]);

  // Obtener todos los docentes en el sistema
  const allTeachers = useMemo(() => {
    return users.filter((user) => {
      const rolesArray = Array.isArray((user as any).roles)
        ? (user as any).roles
        : (user as any).rol
          ? [(user as any).rol]
          : [];
      const normalizedRoles = rolesArray.map((role: any) => String(role).toUpperCase().trim());
      return normalizedRoles.some((role: string) =>
        ['DOCENTE', 'TEACHER', 'PROFESSOR', 'ADMIN', 'ADMINISTRADOR'].includes(role)
      );
    });
  }, [users]);

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
  const handleRemoveStudent = async (projectId: string, studentId: string) => {
    if (window.confirm('¿Seguro que querés quitar este alumno del proyecto?')) {
      const response = await dispatch(removeStudentFromProject({ projectId, studentId }));
      if (!(response as any).error) {
        try {
          window.dispatchEvent(
            new CustomEvent('toast', { detail: { message: 'Alumno quitado del proyecto', type: 'success' } })
          );
        } catch { }
      } else {
        try {
          window.dispatchEvent(
            new CustomEvent('toast', {
              detail: {
                message: (response as any).payload || 'Error al quitar el alumno',
                type: 'error',
              },
            })
          );
        } catch { }
      }
    }
  };



  // Quitar co-docente
  const handleRemoveCoTeacher = async (projectId: string, teacherId: string) => {
    if (window.confirm('¿Seguro que querés quitar este co-docente del proyecto?')) {
      const response = await dispatch(removeCoTeacher({ projectId, teacherId }));
      if (!(response as any).error) {
        try {
          window.dispatchEvent(
            new CustomEvent('toast', { detail: { message: 'Co-docente quitado del proyecto', type: 'success' } })
          );
        } catch { }
      } else {
        try {
          window.dispatchEvent(
            new CustomEvent('toast', {
              detail: {
                message: (response as any).payload || 'Error al quitar el co-docente',
                type: 'error',
              },
            })
          );
        } catch { }
      }
    }
  };

  // Guardar modificaciones del proyecto en la base de datos y recargar Redux
  const handleSaveProjectEdit = async (
    titulo: string,
    descripcion: string,
    categoria: string,
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



  // Restablecer filtros a su estado inicial
  const handleClearAllFilters = () => {
    setFilters({ q: '', categoria: 'ALL', alumnos: 'ALL' });
  };

  return (
    <div className="projects-page-container">
      <div className="projects-card-main">
        {/* Cabecera principal: Título y Botones primario/secundario */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="m-0 projects-title">Proyectos</h1>
            <p className="m-0 text-muted projects-subtitle">
              {isTutor
                ? 'Convocatoria de proyectos disponibles para solicitar unirse como profesor tutor.'
                : 'Gestioná y colaborá en los proyectos.'}
            </p>
          </div>
          {!isTutor && (
            <div className="d-flex gap-2">
              <Link className="btn-new-project" to="/docente/proyectos/nuevo">
                <span>+</span> Nuevo Proyecto
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
          onRemoveStudent={handleRemoveStudent}
          onRemoveCoTeacher={handleRemoveCoTeacher}
          onActivityClick={(project) => setActiveActivityProject(project)}
          onEditClick={(project) => setActiveEditProject(project)}
          onRequestJoinClick={handleRequestJoin}
          pendingProjectIds={pendingProjectIds}
          activeProjectIds={activeProjectIds}
        />

        {/* Espaciador flexible para empujar la paginación al fondo */}
        <div style={{ flexGrow: 1 }} />

        {/* Paginación de Proyectos */}
        {filteredProjects.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filteredProjects.length}
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
    </div>
  );
};

export default TeacherProjectsList;

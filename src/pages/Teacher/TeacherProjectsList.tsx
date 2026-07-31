import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

// Redux Actions & Selectors
import { selectCurrentUser } from '../../../redux/slices/authSlice';
import {
  fetchProjects,
  assignStudentToProject,
  removeStudentFromProject,
  deleteProject,
  addCoTeacher,
  removeCoTeacher,
  selectProjectsByTeacher,
  Project
} from '../../../redux/slices/projectsSlice';
import { selectUsers } from '../../../redux/slices/usersSlice';

// Reusable Components
import Pagination from '../../components/Pagination';
import ProjectFilters, { ProjectFiltersState } from './components/ProjectFilters';
import ProjectTable from './components/ProjectTable';
import {
  ActivityModal,
  AssignStudentModal,
  AddCoTeacherModal,
  EditProjectModal,
  Activity
} from './components/ProjectModals';

// Styles & Assets
import 'bootstrap/dist/css/bootstrap.min.css';
import bgImage from '../../assets/fondo-rojo.jpg';
import './TeacherProjectsList.css';

// Constante para la clave de almacenamiento local de actividad
const ACTIVITY_STORAGE_KEY = 'projectActivity';

/**
 * Componente Principal para la Gestión de Proyectos por parte del Docente.
 * Orquesta la carga de proyectos, filtros avanzados, paginación,
 * y controla los modales de actividad, asignación, colaboración y edición de proyectos.
 */
const TeacherProjectsList: React.FC = () => {
  const dispatch = useDispatch<any>();

  // --- SELECTORES DE REDUX ---
  const currentUser = useSelector(selectCurrentUser);
  const projects = useSelector(selectProjectsByTeacher(currentUser?.id || ''));
  const users = useSelector(selectUsers);

  // --- FILTROS Y ESTADO DE PAGINACIÓN ---
  const [filters, setFilters] = useState<ProjectFiltersState>({ q: '', categoria: 'ALL', alumnos: 'ALL' });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // --- ESTADO DE CONTROL DE MODALES ---
  const [activeActivityProject, setActiveActivityProject] = useState<Project | null>(null);
  const [activeAssignProject, setActiveAssignProject] = useState<Project | null>(null);
  const [activeAddCoTeacherProject, setActiveAddCoTeacherProject] = useState<Project | null>(null);
  const [activeEditProject, setActiveEditProject] = useState<Project | null>(null);

  // --- CARGA INICIAL ---
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

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
        ['DOCENTE', 'TEACHER', 'PROFESSOR', 'ADMIN', 'SUPER_ADMIN', 'ADMINISTRADOR'].includes(role)
      );
    });
  }, [users]);

  // Filtrado de proyectos del docente en base al buscador y filtros seleccionados
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // 1. Filtro por buscador (Título y Descripción)
      const searchQuery = filters.q.trim().toLowerCase();
      const matchesSearch =
        !searchQuery ||
        project.titulo.toLowerCase().includes(searchQuery) ||
        project.descripcion.toLowerCase().includes(searchQuery);

      // 2. Filtro por Categoría
      const matchesCategory =
        filters.categoria === 'ALL' ||
        (project.categoria && project.categoria.toLowerCase() === filters.categoria.toLowerCase());

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
  }, [projects, filters]);

  // Cortar la lista filtrada de proyectos según la página actual
  const paginatedProjects = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, page]);

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

  // Asignar alumno al proyecto
  const handleAssignStudent = async (studentId: string) => {
    if (!activeAssignProject) return;
    const response = await dispatch(
      assignStudentToProject({ projectId: activeAssignProject.id, studentId })
    );
    if (!(response as any).error) {
      try {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Alumno asignado correctamente', type: 'success' } })
        );
      } catch { }
    }
  };

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
      }
    }
  };

  // Agregar co-docente
  const handleAddCoTeacher = async (teacherId: string) => {
    if (!activeAddCoTeacherProject) return;
    const response = await dispatch(
      addCoTeacher({ projectId: activeAddCoTeacherProject.id, teacherId })
    );
    if (!(response as any).error) {
      try {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Co-docente agregado correctamente', type: 'success' } })
        );
      } catch { }
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
      }
    }
  };

  // Guardar modificaciones del proyecto en localStorage y recargar Redux
  const handleSaveProjectEdit = (titulo: string, descripcion: string, categoria: string) => {
    if (!activeEditProject) return;
    const rawProjects = localStorage.getItem('projects');
    const projectsList = rawProjects ? JSON.parse(rawProjects) : [];
    const index = projectsList.findIndex((proj: any) => proj.id === activeEditProject.id);

    if (index !== -1) {
      projectsList[index] = {
        ...projectsList[index],
        titulo,
        descripcion,
        categoria,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('projects', JSON.stringify(projectsList));
      dispatch(fetchProjects()); // Recargar proyectos en el store
      try {
        window.dispatchEvent(
          new CustomEvent('toast', { detail: { message: 'Proyecto modificado correctamente', type: 'success' } })
        );
      } catch { }
    }
  };

  // Mover proyecto a la Papelera (borrado lógico)
  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('¿Seguro que querés eliminar este proyecto? Se moverá a la Papelera.')) {
      const response = await dispatch(deleteProject({ projectId }));
      if (!(response as any).error) {
        try {
          window.dispatchEvent(
            new CustomEvent('toast', { detail: { message: 'Proyecto enviado a la Papelera', type: 'success' } })
          );
        } catch { }
      }
    }
  };

  // Restablecer filtros a su estado inicial
  const handleClearAllFilters = () => {
    setFilters({ q: '', categoria: 'ALL', alumnos: 'ALL' });
  };

  return (
    <div
      className="projects-page-container"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="projects-card-main">
        {/* Cabecera principal: Título y Botones primario/secundario */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h1 className="m-0 projects-title">Proyectos</h1>
            <p className="m-0 text-muted projects-subtitle">Gestioná y colaborá en los proyectos.</p>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn-new-project" to="/docente/proyectos/nuevo">
              <span>+</span> Nuevo Proyecto
            </Link>
            <Link className="btn-trash-secondary" to="/docente/proyectos/papelera">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
              </svg>
              Papelera
            </Link>
          </div>
        </div>

        {/* Sección de Filtros de Búsqueda */}
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={handleClearAllFilters}
        />

        {/* Listado principal: Tabla de Proyectos */}
        <ProjectTable
          projects={paginatedProjects}
          users={users}
          onRemoveStudent={handleRemoveStudent}
          onRemoveCoTeacher={handleRemoveCoTeacher}
          onAssignClick={(project) => setActiveAssignProject(project)}
          onAddCoTeacherClick={(project) => setActiveAddCoTeacherProject(project)}
          onActivityClick={(project) => setActiveActivityProject(project)}
          onEditClick={(project) => setActiveEditProject(project)}
          onDeleteClick={(project) => handleDeleteProject(project.id)}
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

      {/* --- MODAL PARA ASIGNAR UN ALUMNO --- */}
      {activeAssignProject && (
        <AssignStudentModal
          project={activeAssignProject}
          students={activeStudents.filter(
            (student) => !activeAssignProject.students.includes(student.id)
          )}
          onClose={() => setActiveAssignProject(null)}
          onAssign={handleAssignStudent}
        />
      )}

      {/* --- MODAL PARA AGREGAR UN CO-DOCENTE --- */}
      {activeAddCoTeacherProject && (
        <AddCoTeacherModal
          project={activeAddCoTeacherProject}
          teachers={allTeachers.filter(
            (teacher) =>
              teacher.id !== currentUser?.id &&
              !(activeAddCoTeacherProject.coTeachers || []).includes(teacher.id)
          )}
          onClose={() => setActiveAddCoTeacherProject(null)}
          onAdd={handleAddCoTeacher}
        />
      )}

      {/* --- MODAL PARA EDITAR DETALLES DEL PROYECTO --- */}
      {activeEditProject && (
        <EditProjectModal
          project={activeEditProject}
          onClose={() => setActiveEditProject(null)}
          onSave={handleSaveProjectEdit}
        />
      )}
    </div>
  );
};

export default TeacherProjectsList;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectService, ProjectTypeDTO } from '../../src/services/projectService';

export interface ProjectType {
  id: number;
  name: string;
}

export interface ActiveStudentRelation {
  id: number;
  active: boolean;
  student: {
    id_user: number;
    [key: string]: any;
  };
}

export interface ActiveProfessorRelation {
  id: number;
  active: boolean;
  professor: {
    id_user: number;
    [key: string]: any;
  };
}

export interface Project {
  id: string;
  teacherId?: string;
  titulo: string;
  descripcion: string;
  categoria?: string;
  projectType?: ProjectType;
  projectTypeId?: number;
  estado?: string;
  createdAt: string;
  updatedAt: string;
  students: string[]; // IDs de usuario de estudiantes asignados activos
  coTeachers?: string[]; // IDs de usuario de docentes asignados activos
  activeStudents?: ActiveStudentRelation[];
  activeProfessors?: ActiveProfessorRelation[];
  raw?: any;
}

interface ProjectsState {
  list: Project[];
  projectTypes: ProjectType[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProjectsState = {
  list: [],
  projectTypes: [],
  status: 'idle',
  error: null,
};

function normalizeBackendProject(p: any): Project {
  // Extraer alumnos asignados activos
  const students = Array.isArray(p.activeStudents)
    ? p.activeStudents
        .filter((as: any) => as.active)
        .map((as: any) => String(as.student?.id_user || as.student?.id || as.id))
    : Array.isArray(p.students)
    ? p.students.map(String)
    : [];

  // Extraer docentes asignados activos
  const coTeachers = Array.isArray(p.activeProfessors)
    ? p.activeProfessors
        .filter((ap: any) => ap.active)
        .map((ap: any) => String(ap.professor?.id_user || ap.professor?.id || ap.id))
    : Array.isArray(p.coTeachers)
    ? p.coTeachers.map(String)
    : [];

  return {
    id: String(p.id),
    teacherId: p.teacherId ? String(p.teacherId) : coTeachers[0] || '',
    titulo: p.title || p.titulo || 'Sin título',
    descripcion: p.description || p.descripcion || '',
    categoria: p.projectType?.name || p.categoria || 'Other',
    projectType: p.projectType,
    projectTypeId: p.projectType?.id,
    estado: p.status || p.estado || 'pending',
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
    students,
    coTeachers,
    activeStudents: p.activeStudents || [],
    activeProfessors: p.activeProfessors || [],
    raw: p,
  };
}

export const fetchProjects = createAsyncThunk<Project[], void, { rejectValue: string }>(
  'projects/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const data = await projectService.getProjects(token);
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(normalizeBackendProject);
    } catch (error: any) {
      console.error('Error fetching projects from backend:', error);
      return rejectWithValue(error.message || 'Error al obtener proyectos de la base de datos');
    }
  }
);

export const fetchProjectTypes = createAsyncThunk<ProjectType[], void, { rejectValue: string }>(
  'projects/fetchTypes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const types = await projectService.getProjectTypes(token);
      return Array.isArray(types) ? types : [];
    } catch (error: any) {
      console.error('Error fetching project types from backend:', error);
      return rejectWithValue(error.message || 'Error al obtener tipos de proyecto');
    }
  }
);

export const createProject = createAsyncThunk<
  Project,
  {
    teacherId?: string;
    titulo: string;
    descripcion: string;
    categoria?: string;
    projectTypeId?: number;
    customProjectType?: string;
    estado?: string;
  },
  { rejectValue: string }
>('projects/create', async (payload, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const res = await projectService.createProject(
      {
        title: payload.titulo,
        description: payload.descripcion,
        projectTypeId: payload.projectTypeId,
        customProjectType: payload.customProjectType,
      },
      token
    );
    dispatch(fetchProjects());
    return normalizeBackendProject(res);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al crear el proyecto');
  }
});

export const updateProject = createAsyncThunk<
  Project,
  {
    projectId: string | number;
    titulo: string;
    descripcion: string;
    projectTypeId?: number;
  },
  { rejectValue: string }
>('projects/update', async ({ projectId, titulo, descripcion, projectTypeId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const response = await projectService.updateProject(
      projectId,
      {
        title: titulo,
        description: descripcion,
        projectTypeId,
      },
      token
    );
    dispatch(fetchProjects());
    const updated = response.project || response;
    return normalizeBackendProject(updated);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al actualizar el proyecto');
  }
});

export const deleteProject = createAsyncThunk<
  string,
  { projectId: string },
  { rejectValue: string }
>('projects/delete', async ({ projectId }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.deleteProject(projectId, token);
    return projectId;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al eliminar el proyecto');
  }
});

export const assignStudentToProject = createAsyncThunk<
  { projectId: string; studentId: string },
  { projectId: string; studentId: string },
  { rejectValue: string }
>('projects/assignStudent', async ({ projectId, studentId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.approveStudentRequest(projectId, studentId, token);
    dispatch(fetchProjects());
    return { projectId, studentId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al aprobar o asignar alumno');
  }
});

export const removeStudentFromProject = createAsyncThunk<
  { projectId: string; studentId: string },
  { projectId: string; studentId: string },
  { rejectValue: string }
>('projects/removeStudent', async ({ projectId, studentId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.rejectStudentRequest(projectId, studentId, token);
    dispatch(fetchProjects());
    return { projectId, studentId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al quitar el alumno del proyecto');
  }
});

export const addCoTeacher = createAsyncThunk<
  { projectId: string; teacherId: string },
  { projectId: string; teacherId: string },
  { rejectValue: string }
>('projects/addCoTeacher', async ({ projectId, teacherId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.approveProfessorRequest(projectId, teacherId, token);
    dispatch(fetchProjects());
    return { projectId, teacherId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al aprobar o agregar docente');
  }
});

export const removeCoTeacher = createAsyncThunk<
  { projectId: string; teacherId: string },
  { projectId: string; teacherId: string },
  { rejectValue: string }
>('projects/removeCoTeacher', async ({ projectId, teacherId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.rejectProfessorRequest(projectId, teacherId, token);
    dispatch(fetchProjects());
    return { projectId, teacherId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al quitar el docente del proyecto');
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Error al cargar proyectos';
      })
      .addCase(fetchProjectTypes.fulfilled, (state, action: PayloadAction<ProjectType[]>) => {
        state.projectTypes = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.list.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter((p) => p.id !== action.payload);
      })
      .addCase(assignStudentToProject.fulfilled, (state, action) => {
        const p = state.list.find((proj) => proj.id === action.payload.projectId);
        if (p && !p.students.includes(action.payload.studentId)) {
          p.students.push(action.payload.studentId);
        }
      })
      .addCase(removeStudentFromProject.fulfilled, (state, action) => {
        const p = state.list.find((proj) => proj.id === action.payload.projectId);
        if (p) {
          p.students = p.students.filter((s) => s !== action.payload.studentId);
        }
      })
      .addCase(addCoTeacher.fulfilled, (state, action) => {
        const p = state.list.find((proj) => proj.id === action.payload.projectId);
        if (p) {
          if (!p.coTeachers) p.coTeachers = [];
          if (!p.coTeachers.includes(action.payload.teacherId)) {
            p.coTeachers.push(action.payload.teacherId);
          }
        }
      })
      .addCase(removeCoTeacher.fulfilled, (state, action) => {
        const p = state.list.find((proj) => proj.id === action.payload.projectId);
        if (p && p.coTeachers) {
          p.coTeachers = p.coTeachers.filter((t) => t !== action.payload.teacherId);
        }
      })
      .addCase(approveStudentProjectRequest.fulfilled, (state, action) => {
        const p = state.list.find((proj) => proj.id === action.payload.projectId);
        if (p) {
          if (!p.students.includes(action.payload.studentUserId)) {
            p.students.push(action.payload.studentUserId);
          }
          if (Array.isArray(p.activeStudents)) {
            const rel = p.activeStudents.find(
              (as) => String(as.student?.id_user || as.student?.id || as.id) === action.payload.studentUserId
            );
            if (rel) rel.active = true;
          }
          if (p.estado === 'pending') {
            p.estado = 'in_progress';
          }
        }
      })
      .addCase(rejectStudentProjectRequest.fulfilled, (state, action) => {
        const p = state.list.find((proj) => proj.id === action.payload.projectId);
        if (p && Array.isArray(p.activeStudents)) {
          p.activeStudents = p.activeStudents.filter(
            (as) => String(as.student?.id_user || as.student?.id || as.id) !== action.payload.studentUserId
          );
        }
      });
  },
});

export default projectsSlice.reducer;

// Thunks específicos para aprobación y rechazo de solicitudes de estudiantes en proyectos
export const approveStudentProjectRequest = createAsyncThunk<
  { projectId: string; studentUserId: string },
  { projectId: string; studentUserId: string },
  { rejectValue: string }
>('projects/approveStudentRequest', async ({ projectId, studentUserId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.approveStudentRequest(projectId, studentUserId, token);
    dispatch(fetchProjects());
    return { projectId, studentUserId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al aprobar la solicitud del estudiante');
  }
});

export const rejectStudentProjectRequest = createAsyncThunk<
  { projectId: string; studentUserId: string },
  { projectId: string; studentUserId: string },
  { rejectValue: string }
>('projects/rejectStudentRequest', async ({ projectId, studentUserId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.rejectStudentRequest(projectId, studentUserId, token);
    dispatch(fetchProjects());
    return { projectId, studentUserId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al rechazar la solicitud del estudiante');
  }
});

// Selectores
export const selectProjects = (state: any) => state.projects.list as Project[];
export const selectProjectTypes = (state: any) => (state.projects.projectTypes || []) as ProjectType[];
export const selectProjectsStatus = (state: any) => state.projects.status as 'idle' | 'loading' | 'succeeded' | 'failed';
export const selectProjectsError = (state: any) => state.projects.error as string | null;

export interface PendingProjectStudentRequest {
  id: number;
  projectId: string;
  projectTitle: string;
  projectType: string;
  studentUserId: string;
  active: boolean;
}

export const selectPendingProjectRequests = (state: any): PendingProjectStudentRequest[] => {
  const projects = state.projects.list as Project[];
  if (!Array.isArray(projects)) return [];
  const results: PendingProjectStudentRequest[] = [];
  for (const p of projects) {
    if (Array.isArray(p.activeStudents)) {
      for (const as of p.activeStudents) {
        if (as.active === false) {
          results.push({
            id: as.id,
            projectId: String(p.id),
            projectTitle: p.titulo,
            projectType: p.categoria || p.projectType?.name || 'General',
            studentUserId: String(as.student?.id_user || as.student?.id || as.id),
            active: false,
          });
        }
      }
    }
  }
  return results;
};

export const selectProjectsByTeacher = (teacherId: string) => (state: any) => {
  const list = state.projects.list as Project[];
  if (!teacherId) return list;
  return list.filter(
    (p) =>
      p.teacherId === teacherId ||
      (p.coTeachers && p.coTeachers.includes(teacherId)) ||
      (p.activeProfessors &&
        p.activeProfessors.some(
          (ap) => String(ap.professor?.id_user || ap.professor?.id || ap.id) === String(teacherId)
        ))
  );
};

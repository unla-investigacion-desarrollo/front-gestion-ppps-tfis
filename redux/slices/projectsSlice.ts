import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  projectService,
  ProjectTypeDTO,
  PendingRequestsResponse,
  PendingProfessorRequest,
  PendingStudentRequest,
  PendingProjectItem,
  PendingApplicant,
} from '../../src/services/projectService';

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
  pendingRequests: PendingRequestsResponse;
  pendingRequestsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  pendingRequestsError: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProjectsState = {
  list: [],
  projectTypes: [],
  pendingRequests: {
    pendingProfessors: [],
    pendingStudents: [],
  },
  pendingRequestsStatus: 'idle',
  pendingRequestsError: null,
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

export const fetchPendingProjectRequests = createAsyncThunk<
  PendingRequestsResponse,
  void,
  { rejectValue: string }
>('projects/fetchPendingRequests', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const data = await projectService.getPendingRequests(token);
    return data;
  } catch (error: any) {
    console.error('Error fetching pending project requests:', error);
    return rejectWithValue(error.message || 'Error al obtener solicitudes pendientes de la base de datos');
  }
});

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
        state.list = [...action.payload].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeB !== timeA) return timeB - timeA;
          return Number(b.id || 0) - Number(a.id || 0);
        });
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Error al cargar proyectos';
      })
      .addCase(fetchPendingProjectRequests.pending, (state) => {
        state.pendingRequestsStatus = 'loading';
        state.pendingRequestsError = null;
      })
      .addCase(fetchPendingProjectRequests.fulfilled, (state, action: PayloadAction<PendingRequestsResponse>) => {
        state.pendingRequestsStatus = 'succeeded';
        state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingProjectRequests.rejected, (state, action) => {
        state.pendingRequestsStatus = 'failed';
        state.pendingRequestsError = (action.payload as string) || action.error.message || 'Error al cargar solicitudes pendientes';
      })
      .addCase(fetchProjectTypes.fulfilled, (state, action: PayloadAction<ProjectType[]>) => {
        state.projectTypes = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
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
    dispatch(fetchPendingProjectRequests());
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
    dispatch(fetchPendingProjectRequests());
    dispatch(fetchProjects());
    return { projectId, studentUserId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al rechazar la solicitud del estudiante');
  }
});

// Thunks específicos para aprobación y rechazo de solicitudes de docentes en proyectos
export const approveProfessorProjectRequest = createAsyncThunk<
  { projectId: string; professorUserId: string },
  { projectId: string; professorUserId: string },
  { rejectValue: string }
>('projects/approveProfessorRequest', async ({ projectId, professorUserId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.approveProfessorRequest(projectId, professorUserId, token);
    dispatch(fetchPendingProjectRequests());
    dispatch(fetchProjects());
    return { projectId, professorUserId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al aprobar la solicitud del docente');
  }
});

export const rejectProfessorProjectRequest = createAsyncThunk<
  { projectId: string; professorUserId: string },
  { projectId: string; professorUserId: string },
  { rejectValue: string }
>('projects/rejectProfessorRequest', async ({ projectId, professorUserId }, { rejectWithValue, dispatch }) => {
  try {
    const token = localStorage.getItem('token') || '';
    await projectService.rejectProfessorRequest(projectId, professorUserId, token);
    dispatch(fetchPendingProjectRequests());
    dispatch(fetchProjects());
    return { projectId, professorUserId };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al rechazar la solicitud del docente');
  }
});

// Selectores
export const selectProjects = (state: any) => state.projects.list as Project[];
export const selectProjectTypes = (state: any) => (state.projects.projectTypes || []) as ProjectType[];
export const selectProjectsStatus = (state: any) => state.projects.status as 'idle' | 'loading' | 'succeeded' | 'failed';
export const selectProjectsError = (state: any) => state.projects.error as string | null;

export const selectPendingProjectRequestsState = (state: any) =>
  state.projects.pendingRequests as PendingRequestsResponse;
export const selectPendingProjectRequestsStatus = (state: any) =>
  state.projects.pendingRequestsStatus as 'idle' | 'loading' | 'succeeded' | 'failed';
export const selectPendingProjectRequestsError = (state: any) =>
  state.projects.pendingRequestsError as string | null;

export interface UnifiedPendingRequest {
  id: number;
  requestId: number;
  projectId: string;
  projectTitle: string;
  projectType: string;
  applicantId: string;
  studentUserId: string; // retrocompatibilidad
  applicantName: string;
  applicantEmail: string;
  applicantRole: 'student' | 'professor';
  applicantRoleLabel: string;
  specialization?: string;
  yearOfAdmission?: number;
  active: boolean;
  createdAt?: string;
  rawApplicant?: PendingApplicant | any;
  rawProject?: PendingProjectItem | any;
}

export type PendingProjectStudentRequest = UnifiedPendingRequest;

export const selectPendingProjectRequests = (state: any): UnifiedPendingRequest[] => {
  const pending = state.projects?.pendingRequests;
  const results: UnifiedPendingRequest[] = [];

  if (pending) {
    if (Array.isArray(pending.pendingStudents)) {
      for (const req of pending.pendingStudents) {
        const fullName = [req.applicant?.firstName, req.applicant?.lastName].filter(Boolean).join(' ') || 'Estudiante';
        results.push({
          id: req.requestId,
          requestId: req.requestId,
          projectId: String(req.project?.id || ''),
          projectTitle: req.project?.title || 'Sin título',
          projectType: req.project?.type || 'General',
          applicantId: String(req.applicant?.id || ''),
          studentUserId: String(req.applicant?.id || ''),
          applicantName: fullName,
          applicantEmail: req.applicant?.email || '',
          applicantRole: 'student',
          applicantRoleLabel: 'Estudiante',
          yearOfAdmission: req.applicant?.yearOfAdmission,
          active: false,
          rawApplicant: req.applicant,
          rawProject: req.project,
        });
      }
    }

    if (Array.isArray(pending.pendingProfessors)) {
      for (const req of pending.pendingProfessors) {
        const fullName = [req.applicant?.firstName, req.applicant?.lastName].filter(Boolean).join(' ') || 'Docente';
        results.push({
          id: req.requestId,
          requestId: req.requestId,
          projectId: String(req.project?.id || ''),
          projectTitle: req.project?.title || 'Sin título',
          projectType: req.project?.type || 'General',
          applicantId: String(req.applicant?.id || ''),
          studentUserId: String(req.applicant?.id || ''),
          applicantName: fullName,
          applicantEmail: req.applicant?.email || '',
          applicantRole: 'professor',
          applicantRoleLabel: 'Docente',
          specialization: req.applicant?.specialization,
          active: false,
          rawApplicant: req.applicant,
          rawProject: req.project,
        });
      }
    }
  }

  // Fallback si no hay respuestas cargadas en pendingRequests pero sí proyectos en lista
  if (results.length === 0 && Array.isArray(state.projects?.list)) {
    for (const p of state.projects.list) {
      if (Array.isArray(p.activeStudents)) {
        for (const as of p.activeStudents) {
          if (as.active === false) {
            results.push({
              id: as.id,
              requestId: as.id,
              projectId: String(p.id),
              projectTitle: p.titulo,
              projectType: p.categoria || p.projectType?.name || 'General',
              applicantId: String(as.student?.id_user || as.student?.id || as.id),
              studentUserId: String(as.student?.id_user || as.student?.id || as.id),
              applicantName: as.student?.user ? `${as.student.user.firstName || ''} ${as.student.user.lastName || ''}`.trim() : '',
              applicantEmail: as.student?.user?.email || '',
              applicantRole: 'student',
              applicantRoleLabel: 'Estudiante',
              active: false,
              rawApplicant: as.student,
              rawProject: p,
            });
          }
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

import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  projectService,
  PendingRequestsResponse,
} from '../../../services/projectService';

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
  students: string[];
  coTeachers?: string[];
  activeStudents?: ActiveStudentRelation[];
  activeProfessors?: ActiveProfessorRelation[];
  raw?: any;
}

export function normalizeBackendProject(p: any): Project {
  // Normalize students array with support for activeStudents, students, users, and alumnos
  const rawStudents =
    Array.isArray(p.activeStudents) && p.activeStudents.length > 0
      ? p.activeStudents
      : Array.isArray(p.students) && p.students.length > 0
      ? p.students
      : Array.isArray(p.users) && p.users.length > 0
      ? p.users
      : Array.isArray(p.alumnos) && p.alumnos.length > 0
      ? p.alumnos
      : [];

  const students = rawStudents
    .filter((as: any) => as && as.active !== false)
    .map((as: any) => {
      const studentObj = as.student?.user || as.user || as.student || as;
      return String(studentObj.id || as.student?.id_user || as.student?.id || as.id_user || as.id || '');
    })
    .filter(Boolean);

  // Normalize professors / teachers
  const rawProfessors =
    Array.isArray(p.activeProfessors) && p.activeProfessors.length > 0
      ? p.activeProfessors
      : Array.isArray(p.coTeachers) && p.coTeachers.length > 0
      ? p.coTeachers
      : Array.isArray(p.professors) && p.professors.length > 0
      ? p.professors
      : Array.isArray(p.teachers) && p.teachers.length > 0
      ? p.teachers
      : [];

  const coTeachers = rawProfessors
    .filter((ap: any) => ap && ap.active !== false)
    .map((ap: any) => {
      const profObj = ap.professor?.user || ap.user || ap.professor || ap;
      return String(profObj.id || ap.professor?.id_user || ap.professor?.id || ap.id_user || ap.id || '');
    })
    .filter(Boolean);

  const mainTeacherId = p.teacherId
    ? String(p.teacherId)
    : p.teacher?.id
    ? String(p.teacher.id)
    : p.tutor?.id
    ? String(p.tutor.id)
    : coTeachers[0] || '';

  return {
    id: String(p.id),
    teacherId: mainTeacherId,
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
  async (_, { rejectWithValue, signal }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const data = await projectService.getProjects(token, signal);
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(normalizeBackendProject);
    } catch (error: any) {
      if (signal?.aborted) return rejectWithValue('Petición cancelada');
      return rejectWithValue(error.message || 'Error al obtener proyectos de la base de datos');
    }
  }
);

export const fetchPendingProjectRequests = createAsyncThunk<
  PendingRequestsResponse,
  void,
  { rejectValue: string }
>('projects/fetchPendingRequests', async (_, { rejectWithValue, signal }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const data = await projectService.getPendingRequests(token, signal);
    return data;
  } catch (error: any) {
    if (signal?.aborted) return rejectWithValue('Petición cancelada');
    return rejectWithValue(error.message || 'Error al obtener solicitudes pendientes de la base de datos');
  }
});

export const fetchProjectTypes = createAsyncThunk<ProjectType[], void, { rejectValue: string }>(
  'projects/fetchTypes',
  async (_, { rejectWithValue, signal }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const types = await projectService.getProjectTypes(token, signal);
      return Array.isArray(types) ? types : [];
    } catch (error: any) {
      if (signal?.aborted) return rejectWithValue('Petición cancelada');
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

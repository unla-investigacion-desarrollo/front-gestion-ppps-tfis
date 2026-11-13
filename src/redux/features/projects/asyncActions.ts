import { createAsyncThunk } from '@reduxjs/toolkit';
import { normalizeRoles } from '../auth/asyncActions';
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

export interface ProjectStudentWorkOverview {
  id: number;
  status: string;
  lastReviewedAt?: string | null;
  lastReviewedBy?: {
    id: number;
    firstName?: string;
    lastName?: string;
  } | null;
  tutoringRequested?: boolean;
  lastTutoredAt?: string | null;
  lastTutoredBy?: {
    id: number;
    firstName?: string;
    lastName?: string;
  } | null;
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
  activeStudents?: any[];
  activeProfessors?: any[];
  studentWork?: ProjectStudentWorkOverview | null;
  lastReviewedByName?: string | null;
  lastReviewedAt?: string | null;
  lastTutoredByName?: string | null;
  lastTutoredAt?: string | null;
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
      if (typeof as === 'string' || typeof as === 'number') return String(as);
      const studentObj = as.student?.user || as.user || as.student || as;
      return String(studentObj.id || as.student?.id_user || as.student?.id || as.id_user || as.id || '');
    })
    .filter(Boolean);

  const normalizedActiveStudents =
    Array.isArray(p.activeStudents) && p.activeStudents.length > 0
      ? p.activeStudents
      : Array.isArray(p.students) && p.students.some((s: any) => s && typeof s === 'object')
      ? p.students
      : [];

  // Normalize professors / teachers
  const rawProfessors =
    Array.isArray(p.activeProfessors) && p.activeProfessors.length > 0
      ? p.activeProfessors
      : Array.isArray(p.professors) && p.professors.length > 0
      ? p.professors
      : Array.isArray(p.coTeachers) && p.coTeachers.length > 0
      ? p.coTeachers
      : Array.isArray(p.teachers) && p.teachers.length > 0
      ? p.teachers
      : [];

  const coTeachers = rawProfessors
    .filter((ap: any) => ap && ap.active !== false)
    .map((ap: any) => {
      if (typeof ap === 'string' || typeof ap === 'number') return String(ap);
      const profObj = ap.professor?.user || ap.user || ap.professor || ap;
      return String(profObj.id || ap.professor?.id_user || ap.professor?.id || ap.id_user || ap.id || '');
    })
    .filter(Boolean);

  const normalizedActiveProfessors =
    Array.isArray(p.activeProfessors) && p.activeProfessors.length > 0
      ? p.activeProfessors
      : Array.isArray(p.professors) && p.professors.some((prof: any) => prof && typeof prof === 'object')
      ? p.professors
      : [];

  const mainTeacherId = p.teacherId
    ? String(p.teacherId)
    : p.teacher?.id
    ? String(p.teacher.id)
    : p.tutor?.id
    ? String(p.tutor.id)
    : coTeachers[0] || '';

  const reviewer = p.studentWork?.lastReviewedBy || p.lastReviewedBy || null;
  const lastReviewedByName = reviewer
    ? typeof reviewer === 'string'
      ? reviewer
      : [
          reviewer.firstName || reviewer.nombre || reviewer.user?.firstName || reviewer.user?.nombre,
          reviewer.lastName || reviewer.apellido || reviewer.user?.lastName || reviewer.user?.apellido,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        reviewer.name ||
        reviewer.email ||
        (reviewer.id ? `Usuario #${reviewer.id}` : null)
    : null;

  const lastReviewedAt = p.studentWork?.lastReviewedAt || p.lastReviewedAt || null;

  const tutorReviewer = p.studentWork?.lastTutoredBy || p.lastTutoredBy || null;
  const lastTutoredByName = tutorReviewer
    ? typeof tutorReviewer === 'string'
      ? tutorReviewer
      : [
          tutorReviewer.firstName || tutorReviewer.nombre || tutorReviewer.user?.firstName || tutorReviewer.user?.nombre,
          tutorReviewer.lastName || tutorReviewer.apellido || tutorReviewer.user?.lastName || tutorReviewer.user?.apellido,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() ||
        tutorReviewer.name ||
        tutorReviewer.email ||
        (tutorReviewer.id ? `Usuario #${tutorReviewer.id}` : null)
    : null;

  const lastTutoredAt = p.studentWork?.lastTutoredAt || p.lastTutoredAt || null;

  return {
    id: String(p.id),
    teacherId: mainTeacherId,
    titulo: p.title || p.titulo || 'Sin título',
    descripcion: p.description || p.descripcion || '',
    categoria: p.category || p.projectType?.name || p.categoria || 'Other',
    projectType: p.projectType,
    projectTypeId: p.projectType?.id,
    estado: p.status || p.estado || 'pending',
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
    students,
    coTeachers,
    activeStudents: normalizedActiveStudents,
    activeProfessors: normalizedActiveProfessors,
    studentWork: p.studentWork || null,
    lastReviewedByName,
    lastReviewedAt,
    lastTutoredByName,
    lastTutoredAt,
    raw: p,
  };
}

export const fetchProjects = createAsyncThunk<Project[], void, { rejectValue: string }>(
  'projects/fetch',
  async (_, { rejectWithValue, signal, getState }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const state = getState() as any;
      let storedUser: any = {};
      try {
        storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      } catch {}
      const user = state?.auth?.user || storedUser;
      const roles = normalizeRoles([
        ...(Array.isArray(user?.roles) ? user.roles : user?.roles ? [user.roles] : []),
        user?.role,
        user?.rol,
      ]);
      const isAdmin = roles.includes('ADMIN') || roles.includes('SUPERADMIN');
      const isSuperAdmin = roles.includes('SUPERADMIN');
      const isTutor = !isAdmin && Boolean(user?.isTutor);

      let data: any;
      if (isSuperAdmin) {
        const responses = await Promise.allSettled([
          projectService.getProjects(token, signal),
          projectService.getProjectsOverview(token, signal),
        ]);
        const projectsById = new Map<string, any>();
        responses.forEach((response) => {
          if (response.status !== 'fulfilled' || !Array.isArray(response.value)) return;
          response.value.forEach((project: any) => {
            if (project?.id === undefined || project?.id === null) return;
            const projectId = String(project.id);
            projectsById.set(projectId, {
              ...projectsById.get(projectId),
              ...project,
            });
          });
        });
        data = Array.from(projectsById.values());
      } else {
        data = isTutor
          ? await projectService.getProjects(token, signal)
          : await projectService.getProjectsOverview(token, signal);
      }

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

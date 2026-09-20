import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  PendingRequestsResponse,
  PendingApplicant,
  PendingProjectItem,
} from '../../../services/projectService';
import {
  Project,
  ProjectType,
  ActiveStudentRelation,
  ActiveProfessorRelation,
  fetchProjects,
  fetchPendingProjectRequests,
  fetchProjectTypes,
  createProject,
  updateProject,
  deleteProject,
  assignStudentToProject,
  removeStudentFromProject,
  addCoTeacher,
  removeCoTeacher,
  approveStudentProjectRequest,
  rejectStudentProjectRequest,
  approveProfessorProjectRequest,
  rejectProfessorProjectRequest,
} from './asyncActions';

export type {
  Project,
  ProjectType,
  ActiveStudentRelation,
  ActiveProfessorRelation,
};

export interface ProjectsState {
  list: Project[];
  projectTypes: ProjectType[];
  pendingRequests: PendingRequestsResponse;
  pendingRequestsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  pendingRequestsError: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export const initialState: ProjectsState = {
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

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectsError: (state) => {
      state.error = null;
      state.pendingRequestsError = null;
    },
  },
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

export const { clearProjectsError } = projectsSlice.actions;

// Selectores tipados
export const selectProjects = (state: { projects: ProjectsState }) => state.projects.list;
export const selectProjectTypes = (state: { projects: ProjectsState }) => state.projects.projectTypes || [];
export const selectProjectsStatus = (state: { projects: ProjectsState }) => state.projects.status;
export const selectProjectsError = (state: { projects: ProjectsState }) => state.projects.error;

export const selectPendingProjectRequestsState = (state: { projects: ProjectsState }) =>
  state.projects.pendingRequests;
export const selectPendingProjectRequestsStatus = (state: { projects: ProjectsState }) =>
  state.projects.pendingRequestsStatus;
export const selectPendingProjectRequestsError = (state: { projects: ProjectsState }) =>
  state.projects.pendingRequestsError;

export interface UnifiedPendingRequest {
  id: number;
  requestId: number;
  projectId: string;
  projectTitle: string;
  projectType: string;
  applicantId: string;
  studentUserId: string;
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

export const selectPendingProjectRequests = createSelector(
  [selectPendingProjectRequestsState, selectProjects],
  (pending, list): UnifiedPendingRequest[] => {
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

    if (results.length === 0 && Array.isArray(list)) {
      for (const p of list) {
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
  }
);

export const selectProjectsByTeacher = (teacherId: string) => (state: { projects: ProjectsState }) => {
  const list = state.projects.list;
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

export * from './asyncActions';
export default projectsSlice.reducer;

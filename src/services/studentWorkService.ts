import { apiRequest } from './apiClient';

export type StudentWorkStatus =
  | 'pending_review'
  | 'observed'
  | 'approved'
  | 'disapproved'
  | 'absent';

export interface UserSummary {
  id?: number | string;
  id_user?: number | string;
  nombre?: string;
  apellido?: string;
  name?: string;
  email?: string;
}

export interface StudentWork {
  id: number;
  documentUrl: string;
  driveFolderUrl?: string | null;
  status: StudentWorkStatus;
  qualification?: number | null;
  project?: any;
  lastReviewedBy?: UserSummary | string | null;
  lastReviewedAt?: string | null;
  tutoringRequested?: boolean;
  lastTutoredBy?: UserSummary | string | null;
  lastTutoredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentWorkDTO {
  documentUrl: string;
  driveFolderUrl?: string;
}

export interface UpdateStudentWorkDTO {
  documentUrl?: string;
  driveFolderUrl?: string;
}

export interface QualifyStudentWorkDTO {
  qualification: number;
}

export const studentWorkService = {
  /**
   * Consulta la entrega de un proyecto por projectId.
   * Retorna null si no existe entrega registrada (ej: 404).
   */
  getWorkByProject: async (projectId: number | string, token: string): Promise<StudentWork | null> =>
    apiRequest<StudentWork | null>(`/student-work/project/${projectId}`, {
      token,
      nullOn404: true,
      errorMessage: 'Falló la consulta de la entrega del proyecto',
    }),

  /**
   * Registra una entrega para un proyecto.
   * Requiere rol STUDENT o ADMIN.
   * documentUrl es obligatorio (debe ser docs.google.com).
   * driveFolderUrl es opcional (debe ser drive.google.com si se incluye).
   */
  createWork: async (
    projectId: number | string,
    payload: CreateStudentWorkDTO,
    token: string
  ): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/project/${projectId}`, {
      method: 'POST',
      token,
      body: payload,
      errorMessage: 'Falló el registro de la entrega',
    }),

  /**
   * Actualiza los enlaces de la entrega.
   * Requiere rol STUDENT o ADMIN.
   */
  updateWork: async (
    workId: number | string,
    payload: UpdateStudentWorkDTO,
    token: string
  ): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/${workId}`, {
      method: 'PATCH',
      token,
      body: payload,
      errorMessage: 'Falló la actualización de la entrega',
    }),

  /**
   * Marca la entrega con observaciones.
   * Requiere rol PROFESSOR (evaluador) o ADMIN.
   */
  markObserved: async (workId: number | string, token: string): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/${workId}/mark-observed`, {
      method: 'PATCH',
      token,
      errorMessage: 'Falló marcar la entrega con observaciones',
    }),

  /**
   * Vuelve a poner la entrega como pendiente de revisión tras correcciones.
   * Requiere rol STUDENT o ADMIN.
   */
  notifyAdvances: async (workId: number | string, token: string): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/${workId}/notify-advances`, {
      method: 'PATCH',
      token,
      errorMessage: 'Falló la notificación de avances',
    }),

  /**
   * Solicita una tutoría para el proyecto.
   * Requiere rol STUDENT o ADMIN.
   */
  requestTutoring: async (workId: number | string, token: string): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/${workId}/request-tutoring`, {
      method: 'PATCH',
      token,
      errorMessage: 'Falló solicitar tutoría',
    }),

  /**
   * Registra que se realizó una tutoría.
   * Requiere rol PROFESSOR (tutor) o ADMIN.
   */
  markTutored: async (workId: number | string, token: string): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/${workId}/mark-tutored`, {
      method: 'PATCH',
      token,
      errorMessage: 'Falló registrar la tutoría',
    }),

  /**
   * Registra la calificación (0 a 10) y actualiza el estado.
   * 0: absent | 1..3: disapproved | 4..10: approved
   * Requiere rol PROFESSOR (evaluador) o ADMIN.
   */
  qualify: async (
    workId: number | string,
    qualification: number,
    token: string
  ): Promise<StudentWork> =>
    apiRequest<StudentWork>(`/student-work/${workId}/qualify`, {
      method: 'PATCH',
      token,
      body: { qualification },
      errorMessage: 'Falló la calificación de la entrega',
    }),

  /**
   * Lista las calificaciones de estudiantes activos.
   * Requiere rol PROFESSOR o ADMIN.
   */
  getQualifications: async (token: string): Promise<any[]> =>
    apiRequest<any[]>('/student-work/qualifications', {
      token,
      errorMessage: 'Falló la obtención de calificaciones',
    }),
};

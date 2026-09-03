const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

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

const handleResponse = async (res: Response, defaultErrorMessage: string) => {
  const text = await res.text();
  if (!res.ok) {
    let parsedError: any;
    try {
      parsedError = JSON.parse(text);
    } catch { }
    const message =
      parsedError?.message ||
      (Array.isArray(parsedError?.errors) ? parsedError.errors.join(', ') : null) ||
      text ||
      `${defaultErrorMessage} (Status ${res.status})`;
    throw new Error(message);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text ? { message: text } : null;
  }
};

export const studentWorkService = {
  /**
   * Consulta la entrega de un proyecto por projectId.
   * Retorna null si no existe entrega registrada (ej: 404).
   */
  getWorkByProject: async (projectId: number | string, token: string): Promise<StudentWork | null> => {
    const res = await fetch(`${API_URL}/student-work/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 404) {
      return null;
    }

    return handleResponse(res, 'Falló la consulta de la entrega del proyecto');
  },

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
  ): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/project/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return handleResponse(res, 'Falló el registro de la entrega');
  },

  /**
   * Actualiza los enlaces de la entrega.
   * Requiere rol STUDENT o ADMIN.
   */
  updateWork: async (
    workId: number | string,
    payload: UpdateStudentWorkDTO,
    token: string
  ): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/${workId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return handleResponse(res, 'Falló la actualización de la entrega');
  },

  /**
   * Marca la entrega con observaciones.
   * Requiere rol PROFESSOR (evaluador) o ADMIN.
   */
  markObserved: async (workId: number | string, token: string): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/${workId}/mark-observed`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res, 'Falló marcar la entrega con observaciones');
  },

  /**
   * Vuelve a poner la entrega como pendiente de revisión tras correcciones.
   * Requiere rol STUDENT o ADMIN.
   */
  notifyAdvances: async (workId: number | string, token: string): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/${workId}/notify-advances`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res, 'Falló la notificación de avances');
  },

  /**
   * Solicita una tutoría para el proyecto.
   * Requiere rol STUDENT o ADMIN.
   */
  requestTutoring: async (workId: number | string, token: string): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/${workId}/request-tutoring`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res, 'Falló solicitar tutoría');
  },

  /**
   * Registra que se realizó una tutoría.
   * Requiere rol PROFESSOR (tutor) o ADMIN.
   */
  markTutored: async (workId: number | string, token: string): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/${workId}/mark-tutored`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res, 'Falló registrar la tutoría');
  },

  /**
   * Registra la calificación (0 a 10) y actualiza el estado.
   * 0: absent | 1..3: disapproved | 4..10: approved
   * Requiere rol PROFESSOR (evaluador) o ADMIN.
   */
  qualify: async (
    workId: number | string,
    qualification: number,
    token: string
  ): Promise<StudentWork> => {
    const res = await fetch(`${API_URL}/student-work/${workId}/qualify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qualification }),
    });

    return handleResponse(res, 'Falló la calificación de la entrega');
  },

  /**
   * Lista las calificaciones de estudiantes activos.
   * Requiere rol PROFESSOR o ADMIN.
   */
  getQualifications: async (token: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/student-work/qualifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res, 'Falló la obtención de calificaciones');
  },
};

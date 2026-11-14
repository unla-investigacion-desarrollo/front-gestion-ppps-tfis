const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export type PPPStatus =
  | 'pending_application'
  | 'application_rejected'
  | 'pending_documentation'
  | 'in_review'
  | 'observed'
  | 'approved'
  | 'disapproved'
  | 'dropped_out';

export interface PPPApplicant {
  id?: number | string;
  applicationId?: number | string;
  studentId?: number | string;
  studentName?: string;
  studentEmail?: string;
  previousKnowledge?: string;
  appliedAt?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'pending_application' | 'application_rejected' | string;
  student?: {
    id?: number | string;
    fullName?: string;
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface PPPProposal {
  id: number | string;
  title: string;
  description: string;
  driveFolderUrl?: string;
  internalNotes?: string;
  isOpen: boolean;
  createdAt?: string;
  updatedAt?: string;
  applicants?: PPPApplicant[];
}

export interface PPPEpidiente {
  id: number | string;
  type: 'interna' | 'externa' | 'internal' | 'external';
  status: PPPStatus;
  isSiuLoaded: boolean;
  studentId?: number | string;
  studentUserId?: number | string;
  userId?: number | string;
  studentName?: string;
  studentEmail?: string;
  student?: any;
  user?: any;
  estudiante?: any;
  alumno?: any;
  proposalId?: number | string;
  proposalTitle?: string;
  previousKnowledge?: string;
  driveFolderUrl?: string;
  generalDriveUrl?: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateProposalDTO {
  title: string;
  description: string;
  driveFolderUrl?: string;
  internalNotes?: string;
}

export interface UpdateProposalStatusDTO {
  isOpen: boolean;
}

export interface ApplyProposalDTO {
  previousKnowledge: string;
}

export interface GeneralDriveDTO {
  generalDriveUrl: string;
}

// Helper para parsear respuestas o errores del backend
const handleResponse = async (res: Response, defaultErrorMessage: string) => {
  const text = await res.text();
  if (!res.ok) {
    let parsedError: any;
    try {
      parsedError = JSON.parse(text);
    } catch {}
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

export const pppService = {
  /**
   * Catálogo de Convocatorias: GET /ppp/proposals
   * Estudiantes ven solo abiertas. Docentes/Admins ven todas.
   */
  getProposals: async (token: string, isStudent = false): Promise<PPPProposal[]> => {
    const response = await fetch(`${API_URL}/ppp/proposals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(response, 'Error al obtener propuestas');
    const rawList = Array.isArray(data) ? data : data?.proposals || [];
    const normalizedList = rawList.map((proposalItem: any) => {
      const rawApplicants =
        proposalItem.applicants ||
        proposalItem.applications ||
        proposalItem.postulantes ||
        [];
      const applicantsCount =
        proposalItem.applicantsCount ??
        proposalItem.applicationsCount ??
        proposalItem._count?.applications ??
        proposalItem._count?.applicants ??
        rawApplicants.length;
      return {
        ...proposalItem,
        applicants: rawApplicants,
        applications: rawApplicants,
        applicantsCount,
      };
    });

    const filteredList = isStudent
      ? normalizedList.filter((proposalItem: PPPProposal) => proposalItem.isOpen)
      : normalizedList;

    // Si es evaluador o admin, enriquecemos en paralelo con GET /ppp/proposals/:id para reflejar el conteo real
    if (!isStudent && token && filteredList.length > 0) {
      try {
        const enrichedList = await Promise.all(
          filteredList.map(async (proposalItem: PPPProposal) => {
            try {
              const detailResponse = await fetch(`${API_URL}/ppp/proposals/${proposalItem.id}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
              if (!detailResponse.ok) return proposalItem;
              const detailData = await detailResponse.json();
              const detailApplicants = (
                detailData?.applicants ||
                detailData?.applications ||
                detailData?.postulantes ||
                []
              ).map((app: any) => {
                const sId = app?.student?.id_user ?? app?.student?.id ?? app?.studentId;
                return {
                  ...app,
                  studentId: sId,
                  student: app?.student
                    ? { ...app.student, id: sId, id_user: sId }
                    : undefined,
                };
              });
              return {
                ...proposalItem,
                ...detailData,
                applicants: detailApplicants,
                applications: detailApplicants,
                applicantsCount: detailApplicants.length,
              };
            } catch {
              return proposalItem;
            }
          })
        );
        return enrichedList;
      } catch (enrichListError) {
        console.warn('Error al enriquecer convocatorias con postulantes', enrichListError);
        return filteredList;
      }
    }

    return filteredList;
  },

  /**
   * Convocatoria y sus Postulantes: GET /ppp/proposals/:id
   * Exclusivo Docente Evaluador (isTutor: false) y Administrador.
   */
  getProposalById: async (
    proposalId: number | string,
    token: string
  ): Promise<PPPProposal> => {
    const response = await fetch(`${API_URL}/ppp/proposals/${proposalId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(
      response,
      'Error al obtener la convocatoria y postulantes'
    );
    const applicants = (
      data?.applicants ||
      data?.applications ||
      data?.postulantes ||
      []
    ).map((app: any) => {
      const sId = app?.student?.id_user ?? app?.student?.id ?? app?.studentId;
      return {
        ...app,
        studentId: sId,
        student: app?.student
          ? { ...app.student, id: sId, id_user: sId }
          : undefined,
      };
    });
    const applicantsCount =
      data?.applicantsCount ??
      data?._count?.applications ??
      data?._count?.applicants ??
      applicants.length;

    return {
      ...data,
      applicants,
      applications: applicants,
      applicantsCount,
    };
  },

  /**
   * Crear Propuesta Interna: POST /ppp/proposals
   * Exclusivo Docente / Administrador.
   */
  createProposal: async (payload: CreateProposalDTO, token: string): Promise<PPPProposal> => {
    const sanitizedBody = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      driveFolderUrl: payload.driveFolderUrl?.trim() || undefined,
      internalNotes: payload.internalNotes?.trim() || undefined,
    };

    const res = await fetch(`${API_URL}/ppp/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sanitizedBody),
    });
    return await handleResponse(res, 'Error al crear la propuesta de PPP');
  },

  /**
   * Cambiar Estado de Convocatoria: PATCH /ppp/proposals/:id/status
   * Exclusivo Docente / Administrador.
   */
  updateProposalStatus: async (id: number | string, isOpen: boolean, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/proposals/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isOpen }),
    });
    return await handleResponse(res, 'Error al actualizar estado de convocatoria');
  },

  /**
   * Postulación a Propuesta: POST /ppp/proposals/:id/apply
   * Exclusivo Estudiante.
   */
  applyToProposal: async (
    proposalId: number | string,
    previousKnowledge: string,
    token: string,
    _studentInfo?: { id?: string | number; name?: string; email?: string }
  ): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/proposals/${proposalId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ previousKnowledge }),
    });
    return await handleResponse(res, 'Error al postularse a la convocatoria');
  },

  /**
   * Consultar Drive General de la Carrera: GET /ppp/general-drive
   */
  getGeneralDrive: async (token: string): Promise<string> => {
    const res = await fetch(`${API_URL}/ppp/general-drive`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(res, 'Error al consultar Drive general');
    return data?.generalDriveUrl || data?.url || '';
  },

  /**
   * Configurar Drive General de la Carrera: PATCH /ppp/general-drive
   * Exclusivo Docente / Administrador.
   */
  updateGeneralDrive: async (generalDriveUrl: string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/general-drive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ generalDriveUrl }),
    });
    return await handleResponse(res, 'Error al configurar Drive general');
  },

  /**
   * Iniciar Trámite Externo: POST /ppp/external
   * Exclusivo Estudiante. Envía cuerpo vacío {}.
   */
  createExternalPPP: async (
    token: string,
    _studentInfo?: { id?: string | number; name?: string; email?: string }
  ): Promise<PPPEpidiente> => {
    const res = await fetch(`${API_URL}/ppp/external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await handleResponse(res, 'Error al iniciar trámite externo de PPP');
    return normalizeBackendExpediente({
      ...data,
      type: data?.type || 'externa',
      status: data?.status || 'pending_documentation',
      studentId: data?.studentId ?? _studentInfo?.id,
      studentName: data?.studentName || _studentInfo?.name || 'Estudiante',
      studentEmail: data?.studentEmail || _studentInfo?.email || '',
    });
  },

  /**
   * Mis Postulaciones / Trámites de Estudiante: GET /ppp/my-applications
   * Exclusivo Estudiante.
   */
  getMyApplications: async (token: string): Promise<PPPEpidiente[]> => {
    const response = await fetch(`${API_URL}/ppp/my-applications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(response, 'Error al obtener tus trámites de PPP');
    const rawList = Array.isArray(data)
      ? data
      : data?.applications || data?.ppps || data?.expedientes || data?.items || data?.data || [];
    return rawList.map((item: any) => normalizeBackendExpediente(item));
  },

  /**
   * Listado de Trámites PPP: GET /ppp
   * Exclusivo Docente Evaluador y Administrador.
   */
  getPPPTramites: async (token: string): Promise<any[]> => {
    const response = await fetch(`${API_URL}/ppp`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(response, 'Error al obtener trámites PPP');
    const rawList = Array.isArray(data)
      ? data
      : data?.ppps || data?.expedientes || data?.items || data?.data || [];
    return rawList.map((item: any) => normalizeBackendExpediente(item));
  },

  /**
   * Bandeja General de Expedientes: GET /ppp
   * Exclusivo Docentes y Administradores.
   */
  getExpedientes: async (token: string, _useLocalFallback = false): Promise<PPPEpidiente[]> => {
    const res = await fetch(`${API_URL}/ppp`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(res, 'Error al obtener expedientes');
    const rawList = Array.isArray(data) ? data : data?.expedientes || data?.items || [];
    return rawList.map((item: any) => normalizeBackendExpediente(item));
  },

  /**
   * Detalle de Trámite PPP: GET /ppp/:id
   */
  getExpedienteById: async (id: number | string, token: string): Promise<PPPEpidiente | null> => {
    const res = await fetch(`${API_URL}/ppp/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(res, 'Error al obtener detalle del trámite');
    if (!data) return null;
    return normalizeBackendExpediente(data);
  },

  /**
   * Aceptar Postulante: PATCH /ppp/proposals/:proposalId/students/:studentId/accept (cuerpo vacío {})
   */
  acceptProposalApplicant: async (
    proposalId: number | string,
    studentId: number | string,
    token: string
  ): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/proposals/${proposalId}/students/${studentId}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al aceptar al postulante');
  },

  /**
   * Rechazar Postulante: PATCH /ppp/proposals/:proposalId/students/:studentId/reject (cuerpo vacío {})
   */
  rejectProposalApplicant: async (
    proposalId: number | string,
    studentId: number | string,
    token: string
  ): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/proposals/${proposalId}/students/${studentId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al rechazar al postulante');
  },

  /**
   * Observar Trámite: PATCH /ppp/:id/observe (cuerpo vacío {})
   */
  observeExpediente: async (id: number | string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/${id}/observe`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al observar expediente');
  },

  /**
   * Aprobar Trámite: PATCH /ppp/:id/approve (cuerpo vacío {})
   */
  approveExpediente: async (id: number | string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/${id}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al aprobar expediente');
  },

  /**
   * Desaprobar Trámite: PATCH /ppp/:id/disapprove (cuerpo vacío {})
   */
  disapproveExpediente: async (id: number | string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/${id}/disapprove`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al desaprobar expediente');
  },

  /**
   * Confirmar Carga en SIU Guaraní: PATCH /ppp/:id/siu-load (cuerpo vacío {})
   */
  loadSiuExpediente: async (id: number | string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/${id}/siu-load`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al registrar carga en SIU Guaraní');
  },

  /**
   * Notificar Entrega de Documentación: PATCH /ppp/:id/notify-sent (cuerpo vacío {})
   * Exclusivo Estudiante.
   */
  notifySent: async (id: number | string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/${id}/notify-sent`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al notificar entrega de documentación');
  },

  /**
   * Dar de Baja Trámite: PATCH /ppp/:id/abandon (cuerpo vacío {})
   * Exclusivo Estudiante.
   */
  abandonExpediente: async (id: number | string, token: string): Promise<any> => {
    const res = await fetch(`${API_URL}/ppp/${id}/abandon`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    return await handleResponse(res, 'Error al dar de baja el trámite');
  },
};

function getStoredUsersList(): any[] {
  try {
    const raw = localStorage.getItem('users');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function formatNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const prefix = email.split('@')[0];
  const parts = prefix.split(/[._-]/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  return email;
}

export function normalizePPPType(rawType?: any, item?: any): 'interna' | 'externa' {
  const normalized = String(rawType ?? item?.type ?? item?.tipo ?? '')
    .toLowerCase()
    .trim();
  if (normalized === 'interna' || normalized === 'internal') {
    return 'interna';
  }
  if (normalized === 'externa' || normalized === 'external') {
    return 'externa';
  }
  if (item?.proposal || item?.proposalId || item?.proposal_id) {
    return 'interna';
  }
  return 'externa';
}

/**
 * Corrige el desfasaje horario (+3 h en UTC-3) de las columnas @CreateDateColumn / @UpdateDateColumn
 * generadas por MySQL (UTC) y leídas sin timezone:'Z' por el driver mysql2 del backend.
 */
export function normalizeBackendPppDate(rawDate?: any): string | undefined {
  if (!rawDate) return undefined;
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) return String(rawDate);
  const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offsetMs).toISOString();
}

export function formatPPPDateTime(rawDate?: string | Date): string {
  if (!rawDate) return '-';
  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return String(rawDate);
  const datePart = date.toLocaleDateString('es-AR');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = date.getHours() >= 12 ? 'pm' : 'am';
  return `${datePart}, ${hours}:${minutes}:${seconds} ${period}`;
}

export function normalizeBackendExpediente(item: any): PPPEpidiente {
  const normalizedType = normalizePPPType(item?.type ?? item?.tipo, item);
  const resolvedName = getStudentDisplayName(item);
  const resolvedEmail = getStudentEmail(item);
  const proposalObj = item?.proposal || item?.convocatoria || item?.propuesta || null;
  const proposalId = item?.proposalId ?? item?.proposal_id ?? proposalObj?.id;
  const proposalTitle =
    item?.proposalTitle ||
    proposalObj?.title ||
    proposalObj?.titulo ||
    (normalizedType === 'externa'
      ? 'Práctica Profesional Externa'
      : 'Práctica Profesional Supervisada');
  const driveFolderUrl = item?.driveFolderUrl || proposalObj?.driveFolderUrl;
  const studentId =
    item?.studentId ??
    item?.studentUserId ??
    item?.student?.id ??
    item?.student?.id_user ??
    item?.student?.user?.id ??
    item?.userId;

  return {
    ...item,
    type: normalizedType,
    isSiuLoaded: Boolean(item?.isSiuLoaded ?? item?.loadedInSiu ?? item?.siuLoaded),
    studentId,
    studentName: resolvedName !== 'Estudiante' ? resolvedName : item?.studentName || resolvedName,
    studentEmail: resolvedEmail || item?.studentEmail || '',
    proposalId,
    proposalTitle,
    driveFolderUrl,
    createdAt: normalizeBackendPppDate(item?.createdAt) || item?.createdAt,
    updatedAt: normalizeBackendPppDate(item?.updatedAt) || item?.updatedAt,
  };
}

export function getStudentDisplayName(exp: any, users?: any[]): string {
  if (!exp) return 'Estudiante';

  // 1. Direct name on exp
  const directName = exp.studentName || exp.student_name || exp.nombreEstudiante;
  if (
    directName &&
    typeof directName === 'string' &&
    directName.trim() &&
    directName.trim().toLowerCase() !== 'estudiante'
  ) {
    return directName.trim();
  }

  // 2. Direct full name on exp
  const directFull = [exp.nombre || exp.firstName, exp.apellido || exp.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (directFull && directFull.toLowerCase() !== 'estudiante') return directFull;

  // 3. Nested student, user, estudiante, or alumno relation
  const nested = exp.student || exp.user || exp.estudiante || exp.alumno;
  if (nested) {
    if (typeof nested === 'string' && nested.trim() && nested.trim().toLowerCase() !== 'estudiante') {
      return nested.trim();
    }
    if (
      nested.fullName &&
      typeof nested.fullName === 'string' &&
      nested.fullName.trim() &&
      nested.fullName.trim().toLowerCase() !== 'estudiante'
    ) {
      return nested.fullName.trim();
    }
    const nestedFull = [
      nested.nombre || nested.firstName || nested.name,
      nested.apellido || nested.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (nestedFull && nestedFull.toLowerCase() !== 'estudiante') return nestedFull;

    if (nested.user) {
      const subFull = [
        nested.user.nombre || nested.user.firstName || nested.user.name,
        nested.user.apellido || nested.user.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (subFull && subFull.toLowerCase() !== 'estudiante') return subFull;
    }
  }

  // 4. Look up in users list (from Redux or localStorage)
  const studentId = exp.studentId || exp.studentUserId || exp.userId || exp.idStudent || exp.alumnoId;
  const usersList = Array.isArray(users) && users.length > 0 ? users : getStoredUsersList();

  if (studentId && Array.isArray(usersList) && usersList.length > 0) {
    const matched = usersList.find((u: any) => String(u.id) === String(studentId));
    if (matched) {
      const matchedFull = [
        matched.nombre || matched.firstName,
        matched.apellido || matched.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (matchedFull) return matchedFull;
      if (matched.email) return formatNameFromEmail(matched.email);
    }
  }

  // 5. Match by email in usersList
  const expEmail = exp.studentEmail || exp.email || exp.student?.email || exp.user?.email || exp.estudiante?.email;
  if (expEmail && Array.isArray(usersList) && usersList.length > 0) {
    const matchedByEmail = usersList.find(
      (u: any) => u.email && u.email.toLowerCase() === expEmail.toLowerCase()
    );
    if (matchedByEmail) {
      const matchedFull = [
        matchedByEmail.nombre || matchedByEmail.firstName,
        matchedByEmail.apellido || matchedByEmail.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (matchedFull) return matchedFull;
    }
  }

  // 6. Infer readable name from email
  if (expEmail && expEmail.includes('@')) {
    return formatNameFromEmail(expEmail);
  }

  // 7. Check if logged user matches
  try {
    const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (studentId && (String(loggedUser.id) === String(studentId) || studentId === 'me')) {
      const loggedFull = [
        loggedUser.nombre || loggedUser.firstName,
        loggedUser.apellido || loggedUser.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (loggedFull) return loggedFull;
    }
  } catch {}

  if (studentId && studentId !== 'me') {
    return `Estudiante #${studentId}`;
  }

  return 'Estudiante';
}

export function getStudentEmail(exp: any, users?: any[]): string {
  if (!exp) return '';

  if (exp.studentEmail && exp.studentEmail !== '-' && exp.studentEmail.trim()) {
    return exp.studentEmail.trim();
  }
  if (exp.student_email && exp.student_email.trim()) return exp.student_email.trim();
  if (exp.email && exp.email.includes('@')) return exp.email.trim();

  const nested = exp.student || exp.user || exp.estudiante || exp.alumno;
  if (nested?.email && nested.email.includes('@')) return nested.email.trim();
  if (nested?.user?.email && nested.user.email.includes('@')) return nested.user.email.trim();

  const studentId = exp.studentId || exp.studentUserId || exp.userId || exp.idStudent;
  const usersList = Array.isArray(users) && users.length > 0 ? users : getStoredUsersList();

  if (studentId && Array.isArray(usersList)) {
    const matched = usersList.find((u: any) => String(u.id) === String(studentId));
    if (matched?.email) return matched.email;
  }

  try {
    const loggedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (studentId && (String(loggedUser.id) === String(studentId) || studentId === 'me')) {
      if (loggedUser.email) return loggedUser.email;
    }
  } catch {}

  return '';
}

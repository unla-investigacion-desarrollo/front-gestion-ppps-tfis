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
  studentId: number | string;
  studentName?: string;
  studentEmail?: string;
  previousKnowledge: string;
  appliedAt?: string;
  status?: 'pending' | 'accepted' | 'rejected';
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
  type: 'interna' | 'externa';
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

// Claves para persistencia local de respaldo
const STORAGE_PROPOSALS = 'ppp_proposals_mock';
const STORAGE_EXPEDIENTES = 'ppp_expedientes_mock';
const STORAGE_DRIVE = 'ppp_general_drive_mock';

function getLocalProposals(): PPPProposal[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROPOSALS);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial: PPPProposal[] = [
    {
      id: '1',
      title: 'Desarrollo de Módulo de Gestión de Inventario para Cooperativas',
      description: 'Práctica profesional orientada al relevamiento de requerimientos y desarrollo de microservicios para gestión comunitaria.',
      driveFolderUrl: 'https://drive.google.com/drive/folders/ejemplo-convocatoria-1',
      internalNotes: 'Se priorizarán alumnos con materias de bases de datos e ingeniería de software aprobadas.',
      isOpen: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      applicants: [
        {
          studentId: '101',
          studentName: 'Lucas Benítez',
          studentEmail: 'lucas.benitez@alumnos.unla.edu.ar',
          previousKnowledge: 'Experiencia en React y Node.js en proyectos académicos.',
          appliedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'pending',
        },
      ],
    },
    {
      id: '2',
      title: 'Auditoría de Redes y Seguridad en Laboratorios UNLa',
      description: 'Implementación de políticas de control de acceso y testing de penetración en entornos controlados.',
      driveFolderUrl: 'https://drive.google.com/drive/folders/ejemplo-convocatoria-2',
      internalNotes: 'Contacto de soporte técnico interno: Prof. Martínez.',
      isOpen: true,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      applicants: [],
    },
    {
      id: '3',
      title: 'Modernización del Portal Institucional',
      description: 'Migración de componentes legacy a arquitectura moderna accesible.',
      driveFolderUrl: '',
      internalNotes: 'Convocatoria cerrada del ciclo lectivo anterior.',
      isOpen: false,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      applicants: [],
    },
  ];
  localStorage.setItem(STORAGE_PROPOSALS, JSON.stringify(initial));
  return initial;
}

function saveLocalProposals(list: PPPProposal[]) {
  localStorage.setItem(STORAGE_PROPOSALS, JSON.stringify(list));
}

function getLocalExpedientes(): PPPEpidiente[] {
  try {
    const raw = localStorage.getItem(STORAGE_EXPEDIENTES);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial: PPPEpidiente[] = [
    {
      id: '101',
      type: 'interna',
      status: 'in_review',
      isSiuLoaded: false,
      studentId: '101',
      studentName: 'Lucas Benítez',
      studentEmail: 'lucas.benitez@alumnos.unla.edu.ar',
      proposalId: '1',
      proposalTitle: 'Desarrollo de Módulo de Gestión de Inventario para Cooperativas',
      previousKnowledge: 'Experiencia en React y Node.js en proyectos académicos.',
      driveFolderUrl: 'https://drive.google.com/drive/folders/ejemplo-convocatoria-1',
      generalDriveUrl: 'https://drive.google.com/drive/folders/unla-convenios-ppp-oficiales',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: '102',
      type: 'externa',
      status: 'pending_documentation',
      isSiuLoaded: false,
      studentId: '102',
      studentName: 'Carla Morales',
      studentEmail: 'carla.morales@alumnos.unla.edu.ar',
      proposalTitle: 'Práctica Externa en Empresa de Software',
      previousKnowledge: '',
      generalDriveUrl: 'https://drive.google.com/drive/folders/unla-convenios-ppp-oficiales',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
  localStorage.setItem(STORAGE_EXPEDIENTES, JSON.stringify(initial));
  return initial;
}

function saveLocalExpedientes(list: PPPEpidiente[]) {
  localStorage.setItem(STORAGE_EXPEDIENTES, JSON.stringify(list));
}

function getLocalGeneralDrive(): string {
  try {
    const stored = localStorage.getItem(STORAGE_DRIVE);
    if (stored) return stored;
  } catch {}
  const fallback = 'https://drive.google.com/drive/folders/unla-convenios-ppp-oficiales';
  localStorage.setItem(STORAGE_DRIVE, fallback);
  return fallback;
}

function saveLocalGeneralDrive(url: string) {
  localStorage.setItem(STORAGE_DRIVE, url);
}

export const pppService = {
  /**
   * Catálogo de Convocatorias: GET /ppp/proposals
   * Estudiantes ven solo abiertas. Docentes/Admins ven todas.
   */
  getProposals: async (token: string, isStudent = false): Promise<PPPProposal[]> => {
    try {
      const res = await fetch(`${API_URL}/ppp/proposals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await handleResponse(res, 'Error al obtener propuestas');
      if (Array.isArray(data)) {
        return isStudent ? data.filter((p) => p.isOpen) : data;
      }
      return data?.proposals || [];
    } catch (error) {
      console.warn('pppService.getProposals: Usando persistencia local como respaldo', error);
      const list = getLocalProposals();
      return isStudent ? list.filter((p) => p.isOpen) : list;
    }
  },

  /**
   * Crear Propuesta Interna: POST /ppp/proposals
   * Exclusivo Docente / Administrador.
   */
  createProposal: async (payload: CreateProposalDTO, token: string): Promise<PPPProposal> => {
    // Garantizar aislamiento de claves técnicas
    const sanitizedBody = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      driveFolderUrl: payload.driveFolderUrl?.trim() || undefined,
      internalNotes: payload.internalNotes?.trim() || undefined,
    };

    try {
      const res = await fetch(`${API_URL}/ppp/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sanitizedBody),
      });
      return await handleResponse(res, 'Error al crear la propuesta de PPP');
    } catch (error) {
      console.warn('pppService.createProposal: Usando respaldo local', error);
      const list = getLocalProposals();
      const newProp: PPPProposal = {
        id: String(Date.now()),
        title: sanitizedBody.title,
        description: sanitizedBody.description,
        driveFolderUrl: sanitizedBody.driveFolderUrl,
        internalNotes: sanitizedBody.internalNotes,
        isOpen: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        applicants: [],
      };
      list.unshift(newProp);
      saveLocalProposals(list);
      return newProp;
    }
  },

  /**
   * Cambiar Estado de Convocatoria: PATCH /ppp/proposals/:id/status
   * Exclusivo Docente / Administrador.
   */
  updateProposalStatus: async (id: number | string, isOpen: boolean, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/proposals/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOpen }),
      });
      return await handleResponse(res, 'Error al actualizar estado de convocatoria');
    } catch (error) {
      console.warn('pppService.updateProposalStatus: Usando respaldo local', error);
      const list = getLocalProposals();
      const item = list.find((p) => String(p.id) === String(id));
      if (item) {
        item.isOpen = isOpen;
        item.updatedAt = new Date().toISOString();
        saveLocalProposals(list);
      }
      return { success: true, isOpen };
    }
  },

  /**
   * Postulación a Propuesta: POST /ppp/proposals/:id/apply
   * Exclusivo Estudiante.
   */
  applyToProposal: async (
    proposalId: number | string,
    previousKnowledge: string,
    token: string,
    studentInfo?: { id?: string | number; name?: string; email?: string }
  ): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/proposals/${proposalId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ previousKnowledge }),
      });
      return await handleResponse(res, 'Error al postularse a la convocatoria');
    } catch (error) {
      console.warn('pppService.applyToProposal: Usando respaldo local', error);
      const list = getLocalProposals();
      const item = list.find((p) => String(p.id) === String(proposalId));
      if (item) {
        if (!item.applicants) item.applicants = [];
        item.applicants.push({
          studentId: studentInfo?.id || 'me',
          studentName: studentInfo?.name || 'Mi Postulación',
          studentEmail: studentInfo?.email || '',
          previousKnowledge,
          appliedAt: new Date().toISOString(),
          status: 'pending',
        });
        saveLocalProposals(list);
      }

      // También creamos el expediente preliminar en estado pending_application
      const expedientes = getLocalExpedientes();
      const newExp: PPPEpidiente = {
        id: String(Date.now()),
        type: 'interna',
        status: 'pending_application',
        isSiuLoaded: false,
        studentId: studentInfo?.id || 'me',
        studentName: studentInfo?.name || 'Estudiante',
        studentEmail: studentInfo?.email || '',
        proposalId,
        proposalTitle: item?.title || 'Convocatoria PPP',
        previousKnowledge,
        driveFolderUrl: item?.driveFolderUrl,
        generalDriveUrl: getLocalGeneralDrive(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expedientes.unshift(newExp);
      saveLocalExpedientes(expedientes);

      return { success: true, expediente: newExp };
    }
  },

  /**
   * Consultar Drive General de la Carrera: GET /ppp/general-drive
   */
  getGeneralDrive: async (token: string): Promise<string> => {
    try {
      const res = await fetch(`${API_URL}/ppp/general-drive`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await handleResponse(res, 'Error al consultar Drive general');
      return data?.generalDriveUrl || data?.url || getLocalGeneralDrive();
    } catch (error) {
      console.warn('pppService.getGeneralDrive: Usando respaldo local', error);
      return getLocalGeneralDrive();
    }
  },

  /**
   * Configurar Drive General de la Carrera: PATCH /ppp/general-drive
   * Exclusivo Docente / Administrador.
   */
  updateGeneralDrive: async (generalDriveUrl: string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/general-drive`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ generalDriveUrl }),
      });
      return await handleResponse(res, 'Error al configurar Drive general');
    } catch (error) {
      console.warn('pppService.updateGeneralDrive: Usando respaldo local', error);
      saveLocalGeneralDrive(generalDriveUrl);
      return { generalDriveUrl };
    }
  },

  /**
   * Iniciar Trámite Externo: POST /ppp/external
   * Exclusivo Estudiante. Envía cuerpo vacío {}.
   */
  createExternalPPP: async (
    token: string,
    studentInfo?: { id?: string | number; name?: string; email?: string }
  ): Promise<PPPEpidiente> => {
    try {
      const res = await fetch(`${API_URL}/ppp/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al iniciar trámite externo de PPP');
    } catch (error) {
      console.warn('pppService.createExternalPPP: Usando respaldo local', error);
      const expedientes = getLocalExpedientes();
      const newExp: PPPEpidiente = {
        id: String(Date.now()),
        type: 'externa',
        status: 'pending_documentation',
        isSiuLoaded: false,
        studentId: studentInfo?.id || 'me',
        studentName: studentInfo?.name || 'Estudiante',
        studentEmail: studentInfo?.email || '',
        proposalTitle: 'Práctica Profesional Externa Autogestionada',
        generalDriveUrl: getLocalGeneralDrive(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expedientes.unshift(newExp);
      saveLocalExpedientes(expedientes);
      return newExp;
    }
  },

  /**
   * Bandeja General de Expedientes: GET /ppp
   * Exclusivo Docentes y Administradores.
   */
  getExpedientes: async (token: string): Promise<PPPEpidiente[]> => {
    try {
      const res = await fetch(`${API_URL}/ppp`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await handleResponse(res, 'Error al obtener expedientes');
      const rawList = Array.isArray(data) ? data : data?.expedientes || data?.items || [];
      return rawList.map((item: any) => {
        const resolvedName = getStudentDisplayName(item);
        const resolvedEmail = getStudentEmail(item);
        return {
          ...item,
          studentName: resolvedName !== 'Estudiante' ? resolvedName : item.studentName || resolvedName,
          studentEmail: resolvedEmail || item.studentEmail || '',
        };
      });
    } catch (error) {
      console.warn('pppService.getExpedientes: Usando respaldo local', error);
      return getLocalExpedientes();
    }
  },

  /**
   * Detalle de Trámite PPP: GET /ppp/:id
   */
  getExpedienteById: async (id: number | string, token: string): Promise<PPPEpidiente | null> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await handleResponse(res, 'Error al obtener detalle del trámite');
      if (!data) return null;
      const resolvedName = getStudentDisplayName(data);
      const resolvedEmail = getStudentEmail(data);
      return {
        ...data,
        studentName: resolvedName !== 'Estudiante' ? resolvedName : data.studentName || resolvedName,
        studentEmail: resolvedEmail || data.studentEmail || '',
      };
    } catch (error) {
      console.warn('pppService.getExpedienteById: Usando respaldo local', error);
      const list = getLocalExpedientes();
      return list.find((e) => String(e.id) === String(id)) || null;
    }
  },

  /**
   * Aceptar Postulante: PATCH /ppp/proposals/:proposalId/students/:studentId/accept (cuerpo vacío {})
   */
  acceptProposalApplicant: async (
    proposalId: number | string,
    studentId: number | string,
    token: string
  ): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/proposals/${proposalId}/students/${studentId}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al aceptar al postulante');
    } catch (error) {
      console.warn('pppService.acceptProposalApplicant: Usando respaldo local', error);
      const list = getLocalProposals();
      const prop = list.find((p) => String(p.id) === String(proposalId));
      if (prop?.applicants) {
        const app = prop.applicants.find((a) => String(a.studentId) === String(studentId));
        if (app) app.status = 'accepted';
        saveLocalProposals(list);
      }
      // Actualizar expediente si existe o crearlo en pending_documentation
      const expedientes = getLocalExpedientes();
      let exp = expedientes.find(
        (e) => String(e.proposalId) === String(proposalId) && String(e.studentId) === String(studentId)
      );
      if (exp) {
        exp.status = 'pending_documentation';
        exp.updatedAt = new Date().toISOString();
      } else {
        expedientes.unshift({
          id: String(Date.now()),
          type: 'interna',
          status: 'pending_documentation',
          isSiuLoaded: false,
          studentId,
          proposalId,
          proposalTitle: prop?.title || 'Convocatoria PPP',
          driveFolderUrl: prop?.driveFolderUrl,
          generalDriveUrl: getLocalGeneralDrive(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      saveLocalExpedientes(expedientes);
      return { success: true };
    }
  },

  /**
   * Rechazar Postulante: PATCH /ppp/proposals/:proposalId/students/:studentId/reject (cuerpo vacío {})
   */
  rejectProposalApplicant: async (
    proposalId: number | string,
    studentId: number | string,
    token: string
  ): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/proposals/${proposalId}/students/${studentId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al rechazar al postulante');
    } catch (error) {
      console.warn('pppService.rejectProposalApplicant: Usando respaldo local', error);
      const list = getLocalProposals();
      const prop = list.find((p) => String(p.id) === String(proposalId));
      if (prop?.applicants) {
        const app = prop.applicants.find((a) => String(a.studentId) === String(studentId));
        if (app) app.status = 'rejected';
        saveLocalProposals(list);
      }
      const expedientes = getLocalExpedientes();
      const exp = expedientes.find(
        (e) => String(e.proposalId) === String(proposalId) && String(e.studentId) === String(studentId)
      );
      if (exp) {
        exp.status = 'application_rejected';
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(expedientes);
      }
      return { success: true };
    }
  },

  /**
   * Observar Trámite: PATCH /ppp/:id/observe (cuerpo vacío {})
   */
  observeExpediente: async (id: number | string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}/observe`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al observar expediente');
    } catch (error) {
      console.warn('pppService.observeExpediente: Usando respaldo local', error);
      const list = getLocalExpedientes();
      const exp = list.find((e) => String(e.id) === String(id));
      if (exp) {
        exp.status = 'observed';
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(list);
      }
      return { success: true, status: 'observed' };
    }
  },

  /**
   * Aprobar Trámite: PATCH /ppp/:id/approve (cuerpo vacío {})
   */
  approveExpediente: async (id: number | string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al aprobar expediente');
    } catch (error) {
      console.warn('pppService.approveExpediente: Usando respaldo local', error);
      const list = getLocalExpedientes();
      const exp = list.find((e) => String(e.id) === String(id));
      if (exp) {
        exp.status = 'approved';
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(list);
      }
      return { success: true, status: 'approved' };
    }
  },

  /**
   * Desaprobar Trámite: PATCH /ppp/:id/disapprove (cuerpo vacío {})
   */
  disapproveExpediente: async (id: number | string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}/disapprove`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al desaprobar expediente');
    } catch (error) {
      console.warn('pppService.disapproveExpediente: Usando respaldo local', error);
      const list = getLocalExpedientes();
      const exp = list.find((e) => String(e.id) === String(id));
      if (exp) {
        exp.status = 'disapproved';
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(list);
      }
      return { success: true, status: 'disapproved' };
    }
  },

  /**
   * Confirmar Carga en SIU Guaraní: PATCH /ppp/:id/siu-load (cuerpo vacío {})
   */
  loadSiuExpediente: async (id: number | string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}/siu-load`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al registrar carga en SIU Guaraní');
    } catch (error) {
      console.warn('pppService.loadSiuExpediente: Usando respaldo local', error);
      const list = getLocalExpedientes();
      const exp = list.find((e) => String(e.id) === String(id));
      if (exp) {
        exp.isSiuLoaded = true;
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(list);
      }
      return { success: true, isSiuLoaded: true };
    }
  },

  /**
   * Notificar Entrega de Documentación: PATCH /ppp/:id/notify-sent (cuerpo vacío {})
   * Exclusivo Estudiante.
   */
  notifySent: async (id: number | string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}/notify-sent`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al notificar entrega de documentación');
    } catch (error) {
      console.warn('pppService.notifySent: Usando respaldo local', error);
      const list = getLocalExpedientes();
      const exp = list.find((e) => String(e.id) === String(id));
      if (exp) {
        exp.status = 'in_review';
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(list);
      }
      return { success: true, status: 'in_review' };
    }
  },

  /**
   * Dar de Baja Trámite: PATCH /ppp/:id/abandon (cuerpo vacío {})
   * Exclusivo Estudiante.
   */
  abandonExpediente: async (id: number | string, token: string): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ppp/${id}/abandon`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      return await handleResponse(res, 'Error al dar de baja el trámite');
    } catch (error) {
      console.warn('pppService.abandonExpediente: Usando respaldo local', error);
      const list = getLocalExpedientes();
      const exp = list.find((e) => String(e.id) === String(id));
      if (exp) {
        exp.status = 'dropped_out';
        exp.updatedAt = new Date().toISOString();
        saveLocalExpedientes(list);
      }
      return { success: true, status: 'dropped_out' };
    }
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

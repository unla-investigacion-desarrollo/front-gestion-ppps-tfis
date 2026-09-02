const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export interface ProjectTypeDTO {
  id: number;
  name: string;
}

export interface CreateProjectDTO {
  title: string;
  description?: string;
  projectTypeId?: number;
  customProjectType?: string;
}

export interface UpdateProjectDTO {
  title?: string;
  description?: string;
  projectTypeId?: number;
}

export const projectService = {
  /**
   * Obtiene todos los proyectos accesibles para el usuario autenticado.
   * Admin y Docente Evaluador reciben proyectos con relaciones completas.
   * Docente Tutor y Alumno reciben información básica.
   */
  getProjects: async (token: string) => {
    const res = await fetch(`${API_URL}/project`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la obtención de proyectos`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  },

  /**
   * Obtiene los tipos de proyectos existentes en el sistema.
   */
  getProjectTypes: async (token: string): Promise<ProjectTypeDTO[]> => {
    const res = await fetch(`${API_URL}/project/types`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la obtención de tipos de proyecto`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  },

  /**
   * Obtiene un proyecto por ID.
   */
  getProjectById: async (id: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la obtención del proyecto`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  },

  /**
   * Crea un nuevo proyecto.
   */
  createProject: async (payload: CreateProjectDTO, token: string) => {
    const res = await fetch(`${API_URL}/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la creación del proyecto`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Actualiza el proyecto (título, descripción, tipo).
   */
  updateProject: async (id: number | string, payload: UpdateProjectDTO, token: string) => {
    const res = await fetch(`${API_URL}/project/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la actualización del proyecto`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Elimina un proyecto (rol Admin).
   */
  deleteProject: async (id: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la eliminación del proyecto`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Solicitud de estudiante para unirse a un proyecto.
   */
  requestJoinAsStudent: async (projectId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${projectId}/join-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la solicitud de unirse al proyecto`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Docente/Admin aprueba solicitud de estudiante.
   */
  approveStudentRequest: async (projectId: number | string, studentUserId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${projectId}/approve-student/${studentUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la aprobación de la solicitud`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Docente/Admin rechaza o elimina un estudiante de un proyecto.
   */
  rejectStudentRequest: async (projectId: number | string, studentUserId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${projectId}/reject-student/${studentUserId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la remoción del alumno`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Solicitud de docente tutor para unirse a un proyecto.
   */
  requestJoinAsProfessor: async (projectId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${projectId}/join-professor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la solicitud de unirse como docente`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Docente evaluador/Admin aprueba solicitud de docente.
   */
  approveProfessorRequest: async (projectId: number | string, professorUserId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${projectId}/approve-professor/${professorUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la aprobación del docente`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Docente evaluador/Admin rechaza o quita docente de un proyecto.
   */
  rejectProfessorRequest: async (projectId: number | string, professorUserId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/project/${projectId}/reject-professor/${professorUserId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la remoción del docente`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  /**
   * Obtiene las solicitudes pendientes del alumno o docente (active: false).
   */
  getMyRequests: async (token: string) => {
    const res = await fetch(`${API_URL}/project/my-requests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la obtención de solicitudes`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  },

  /**
   * Obtiene los proyectos activos del alumno o docente (active: true).
   */
  getMyActiveProjects: async (token: string) => {
    const res = await fetch(`${API_URL}/project/my-projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la obtención de proyectos activos`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  },
};

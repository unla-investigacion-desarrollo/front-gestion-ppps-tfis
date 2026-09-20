const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export const userService = {
  getUsers: async (token: string, signal?: AbortSignal) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Error ${res.status}: Falló la obtención de usuarios`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn('The backend returned a non-JSON placeholder response for GET /users:', text);
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error('La respuesta del servidor no es un listado válido');
    }

    return data;
  },
  registerAdmin: async (
    payload: {
      nombre: string;
      apellido: string;
      dni: string;
      email: string;
      password?: string;
    },
    token: string | null
  ) => {
    return fetch(`${API_URL}/users/register-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: payload.nombre,
        lastName: payload.apellido,
        dni: payload.dni,
        email: payload.email,
        password: payload.password,
      }),
    });
  },

  registerProfessor: async (
    payload: {
      nombre: string;
      apellido: string;
      dni: string;
      email: string;
      password?: string;
      specialization: string;
      isTutor: boolean;
    },
    token: string | null
  ) => {
    return fetch(`${API_URL}/users/register-professor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName: payload.nombre,
        lastName: payload.apellido,
        dni: payload.dni,
        email: payload.email,
        password: payload.password,
        specialization: payload.specialization,
        isTutor: payload.isTutor,
      }),
    });
  },

  deleteUser: async (userId: number | string, token: string) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
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
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la eliminación del usuario`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  updateUser: async (userId: number | string, token: string, data: any) => {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la actualización del usuario`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  updateUserStatus: async (userId: number | string, token: string, isActive: boolean) => {
    const res = await fetch(`${API_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });

    const text = await res.text();
    if (!res.ok) {
      let parsedError;
      try {
        parsedError = JSON.parse(text);
      } catch {}
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la actualización del estado del usuario`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  getUserProfile: async (id: number | string, token: string) => {
    const res = await fetch(`${API_URL}/users/${id}/profile`, {
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
      throw new Error(parsedError?.message || text || `Error ${res.status}: Falló la obtención del perfil de usuario`);
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  },

  changePassword: async (
    userId: number | string,
    token: string,
    payload: { currentPassword: string; newPassword: string }
  ) => {
    const res = await fetch(`${API_URL}/users/${userId}/change-password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      }),
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const errorMsg =
        data?.message ||
        (res.status === 400 ? 'La contraseña actual es incorrecta o los datos son inválidos' : '') ||
        text ||
        `Error ${res.status}: Falló el cambio de contraseña`;
      throw new Error(errorMsg);
    }

    return data;
  },
};

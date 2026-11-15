const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export const authService = {
  login: async (credentials: { email: string; password: string }, signal?: AbortSignal) => {
    return fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      signal,
    });
  },

  registerStudent: async (payload: {
    nombre: string;
    apellido: string;
    dni?: string;
    email: string;
    password?: string;
    yearOfAdmission?: number | string;
    completedCoursesWithFinal?: number | string;
    completedCoursesWithoutFinal?: number | string;
  }, signal?: AbortSignal) => {
    const parseNumericField = (val: number | string | undefined) => {
      if (val === undefined || val === null || String(val).trim() === '') return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    };

    return fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        firstName: payload.nombre,
        lastName: payload.apellido,
        dni: payload.dni,
        email: payload.email,
        password: payload.password,
        yearOfAdmission: parseNumericField(payload.yearOfAdmission),
        completedCoursesWithFinal: parseNumericField(payload.completedCoursesWithFinal),
        completedCoursesWithoutFinal: parseNumericField(payload.completedCoursesWithoutFinal),
      }),
    });
  },

  forgotPassword: async (email: string, signal?: AbortSignal) => {
    return fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      signal,
    });
  },
};

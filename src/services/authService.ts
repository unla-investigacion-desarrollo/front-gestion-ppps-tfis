const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
  },

  registerStudent: async (payload: {
    nombre: string;
    apellido: string;
    dni?: string;
    email: string;
    password?: string;
    yearOfAdmission?: number;
    completedCoursesWithFinal?: number;
    completedCoursesWithoutFinal?: number;
  }) => {
    return fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: payload.nombre,
        lastName: payload.apellido,
        dni: payload.dni,
        email: payload.email,
        password: payload.password,
        yearOfAdmission: payload.yearOfAdmission !== undefined ? Number(payload.yearOfAdmission) : undefined,
        completedCoursesWithFinal: payload.completedCoursesWithFinal !== undefined ? Number(payload.completedCoursesWithFinal) : 0,
        completedCoursesWithoutFinal: payload.completedCoursesWithoutFinal !== undefined ? Number(payload.completedCoursesWithoutFinal) : 0,
      }),
    });
  },
};

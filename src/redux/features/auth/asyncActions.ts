import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  roles?: string[];
  mustChangePassword?: boolean;
  isTutor?: boolean;
  nombre?: string;
  apellido?: string;
  firstName?: string;
  lastName?: string;
}

export const normalizeRole = (role: any): string => {
  if (!role && role !== 0) return '';

  let roleStr = typeof role === 'string'
    ? role
    : (role.authority || role.name || String(role || ''));

  roleStr = roleStr.toUpperCase().trim();
  if (roleStr.startsWith('ROLE_')) {
    roleStr = roleStr.substring(5);
  }

  switch (roleStr) {
    case 'STUDEN':
    case 'STUDENT':
    case 'ALUMNO':
    case 'ALUMNA':
      return 'ESTUDIANTE';
    case 'TEACHER':
    case 'PROFESSOR':
      return 'DOCENTE';
    case 'ADMIN':
      return 'ADMIN';
    case 'DOCENTE':
    case 'ESTUDIANTE':
      return roleStr;
    default:
      return roleStr;
  }
};

export const normalizeRoles = (rolesSource: any): string[] => {
  if (typeof rolesSource === 'string') {
    rolesSource = rolesSource.includes(',')
      ? rolesSource.split(',').map((r: string) => r.trim())
      : [rolesSource];
  }

  const rawRoles = Array.isArray(rolesSource) ? rolesSource : [rolesSource];
  return rawRoles
    .map((r: any) => normalizeRole(r))
    .filter((r: string) => r.length > 0);
};

export const decodeJwt = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue, signal }) => {
    try {
      const response = await authService.login(credentials, signal);
      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error en el inicio de sesión');
      }

      const token = data.token;
      if (!token) {
        return rejectWithValue('No se recibió el token del servidor');
      }

      const decoded = decodeJwt(token) || {};
      const email = data.email || decoded.email || decoded.sub || credentials.email;
      const userId = String(data.user?.id || decoded.id || decoded.sub || '');

      // Consultar perfil completo del usuario directamente desde la BD: GET /users/:id/profile
      let dbProfile: any = null;
      if (userId && token) {
        try {
          dbProfile = await userService.getUserProfile(userId, token);
        } catch (e) {
          console.warn('No se pudo consultar el perfil de la BD durante login:', e);
        }
      }

      const role = dbProfile?.role
        ? String(dbProfile.role).toLowerCase()
        : data.role
        ? String(data.role).toLowerCase()
        : decoded.role
        ? String(decoded.role).toLowerCase()
        : 'student';

      const isTutor = dbProfile?.isTutor !== undefined
        ? Boolean(dbProfile.isTutor)
        : Boolean(data.isTutor ?? data.user?.isTutor ?? decoded.isTutor);

      const firstName =
        dbProfile?.firstName ||
        dbProfile?.nombre ||
        data.firstName ||
        data.nombre ||
        data.user?.firstName ||
        data.user?.nombre ||
        decoded.firstName ||
        '';

      const lastName =
        dbProfile?.lastName ||
        dbProfile?.apellido ||
        data.lastName ||
        data.apellido ||
        data.user?.lastName ||
        data.user?.apellido ||
        decoded.lastName ||
        '';

      const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        data.name ||
        data.user?.name ||
        decoded.name ||
        email.split('@')[0];

      const mappedUser: User = {
        id: userId || String(email),
        email: email,
        name: fullName,
        nombre: firstName,
        apellido: lastName,
        firstName: firstName,
        lastName: lastName,
        role: role,
        roles: [role],
        mustChangePassword: !!(decoded.mustChangePassword || data.mustChangePassword),
        isTutor: isTutor,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      localStorage.setItem('lastLogin', new Date().toISOString());

      return { user: mappedUser, token };
    } catch (error: any) {
      if (signal?.aborted) {
        return rejectWithValue('Petición cancelada');
      }
      return rejectWithValue(error instanceof Error ? error.message : 'Error de conexión con el servidor');
    }
  }
);

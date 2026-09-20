import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/authService';

export interface User {
  id: string;
  email: string;
  name: string;
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

      let localUser: any = null;
      try {
        const usersList = JSON.parse(localStorage.getItem('users') || '[]');
        localUser = usersList.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      } catch {}

      const rolesSource = decoded.roles || decoded.role || decoded.rol || decoded.authorities || localUser?.rol || [];
      const normalizedRoles = normalizeRoles(rolesSource);

      const finalRoles = normalizedRoles.length > 0
        ? normalizedRoles
        : (localUser?.rol ? [normalizeRole(localUser.rol)] : ['ESTUDIANTE']);

      let firstName =
        data.firstName ||
        data.nombre ||
        data.user?.firstName ||
        data.user?.nombre ||
        localUser?.nombre ||
        localUser?.firstName ||
        decoded.firstName ||
        decoded.nombre ||
        '';

      let lastName =
        data.lastName ||
        data.apellido ||
        data.user?.lastName ||
        data.user?.apellido ||
        localUser?.apellido ||
        localUser?.lastName ||
        decoded.lastName ||
        decoded.apellido ||
        '';

      let isTutor = Boolean(
        data.isTutor !== undefined ? data.isTutor :
        data.user?.isTutor !== undefined ? data.user.isTutor :
        localUser?.isTutor !== undefined ? localUser.isTutor :
        decoded.isTutor !== undefined ? decoded.isTutor :
        (email.toLowerCase().includes('tutor') || normalizedRoles.includes('TUTOR'))
      );

      if (!firstName && token) {
        try {
          const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');
          const res = await fetch(`${API_URL}/users`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            signal,
          });
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) {
              const matched = list.find((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim());
              if (matched) {
                firstName = matched.firstName || matched.nombre || '';
                lastName = matched.lastName || matched.apellido || '';
                if (matched.isTutor !== undefined) isTutor = Boolean(matched.isTutor);
              }
            }
          }
        } catch {}
      }

      const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        data.name ||
        data.user?.name ||
        decoded.name ||
        email.split('@')[0];

      const mappedUser: User = {
        id: String(data.user?.id || decoded.id || decoded.sub || localUser?.id || email),
        email: email,
        name: fullName,
        nombre: firstName,
        apellido: lastName,
        firstName: firstName,
        lastName: lastName,
        roles: finalRoles,
        mustChangePassword: !!(decoded.mustChangePassword || data.mustChangePassword),
        isTutor: isTutor,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      localStorage.setItem('teacherViewProfile', isTutor ? 'tutor' : 'evaluador');
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

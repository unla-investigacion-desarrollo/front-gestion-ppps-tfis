import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import { normalizeRole } from '../auth/asyncActions';

export type UserRole = 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'disabled' | 'papelera';

export interface User {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol: UserRole;
  estado: UserStatus;
  activo?: boolean;
  dni?: string;
  fechaNacimiento?: string;
  cuil?: string;
  sexo?: 'F' | 'M' | 'N';
  legajo?: string;
  carrera?: string;
  departamento?: string;
  categoria?: string;
  password?: string;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isTutor?: boolean;
  yearOfAdmission?: number;
  completedCoursesWithFinal?: number;
  completedCoursesWithoutFinal?: number;
  specialization?: string;
}

const STORAGE_KEY = 'users';

export function loadUsers(): User[] {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]) {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  } catch {}
}

export function resolveUserStatus(u: any): { estado: UserStatus; activo: boolean } {
  const rawStatus = String(u?.estado || u?.status || '').toLowerCase().trim();
  if (rawStatus === 'disabled' || rawStatus === 'inactive' || rawStatus === 'inactivo') {
    return { estado: 'disabled', activo: false };
  }
  if (rawStatus === 'rejected' || rawStatus === 'rechazado') {
    return { estado: 'rejected', activo: false };
  }
  if (rawStatus === 'pending' || rawStatus === 'pendiente') {
    return { estado: 'pending', activo: false };
  }
  if (rawStatus === 'invited' || rawStatus === 'invitado') {
    return { estado: 'disabled', activo: false };
  }
  if (rawStatus === 'papelera' || rawStatus === 'deleted') {
    return { estado: 'papelera', activo: false };
  }

  const rawActive = u?.isActive ?? u?.active ?? u?.activo ?? u?.enabled;
  if (rawActive === false || rawActive === 0 || String(rawActive).toLowerCase() === 'false') {
    return { estado: 'disabled', activo: false };
  }

  return { estado: 'active', activo: true };
}

export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  'users/fetch',
  async (_, { rejectWithValue, signal }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const data = await userService.getUsers(token, signal);

      return data.map((u: any) => {
        const { estado, activo } = resolveUserStatus(u);
        return {
          id: String(u.id),
          email: u.email,
          nombre: u.firstName || u.nombre,
          apellido: u.lastName || u.apellido,
          rol: (normalizeRole(u.role || u.rol) as UserRole) || 'ESTUDIANTE',
          estado,
          activo,
          dni: u.dni,
          legajo: u.fileNumber || u.legajo,
          yearOfAdmission: u.yearOfAdmission,
          completedCoursesWithFinal: u.completedCoursesWithFinal,
          completedCoursesWithoutFinal: u.completedCoursesWithoutFinal,
          specialization: u.specialization || u.categoria,
          isTutor: !!u.isTutor,
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString(),
        };
      });
    } catch (error: any) {
      if (signal?.aborted) {
        return rejectWithValue('Petición cancelada');
      }
      return rejectWithValue(error.message || 'Error al obtener usuarios de la base de datos');
    }
  }
);

export const changePassword = createAsyncThunk<
  { id: string; message?: string },
  { id: string; currentPassword: string; newPassword: string },
  { rejectValue: string }
>('users/changePassword', async ({ id, currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    if (!currentPassword || currentPassword.length < 6) {
      return rejectWithValue('La contraseña actual debe tener al menos 6 caracteres');
    }
    if (!newPassword || newPassword.length < 6) {
      return rejectWithValue('La nueva contraseña debe tener al menos 6 caracteres');
    }
    if (currentPassword === newPassword) {
      return rejectWithValue('La nueva contraseña no puede ser igual a la actual');
    }

    const token = localStorage.getItem('token') || '';
    if (!token) {
      return rejectWithValue('Sesión no válida o expirada. Por favor, vuelva a iniciar sesión.');
    }

    let targetId = id;
    if (!targetId || targetId === 'undefined') {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          targetId = u.id;
        }
      } catch {}
    }

    const response = await userService.changePassword(targetId, token, {
      currentPassword,
      newPassword,
    });

    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        u.mustChangePassword = false;
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch {}

    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === targetId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], mustChangePassword: false, updatedAt: new Date().toISOString() };
      saveUsers(users);
    }

    return { id: String(targetId), message: response?.message || 'Contraseña actualizada correctamente' };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al cambiar la contraseña');
  }
});

export const toggleUserActivation = createAsyncThunk<
  User,
  { id: string; enable: boolean; user?: User },
  { rejectValue: string }
>('users/toggleUserActivation', async ({ id, enable, user }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token') || '';
    const response = await userService.updateUserStatus(id, token, enable);
    const rawUser = response.user || response || {};

    const updatedUser: User = {
      id: String(rawUser.id || id),
      email: rawUser.email || user?.email || '',
      nombre: rawUser.firstName || rawUser.nombre || user?.nombre || '',
      apellido: rawUser.lastName || rawUser.apellido || user?.apellido || '',
      rol: (normalizeRole(rawUser.role || rawUser.rol || user?.rol) as UserRole) || 'ESTUDIANTE',
      estado: enable ? 'active' : 'disabled',
      activo: enable,
      dni: rawUser.dni || user?.dni,
      legajo: rawUser.fileNumber || rawUser.legajo || user?.legajo,
      yearOfAdmission: rawUser.yearOfAdmission || user?.yearOfAdmission,
      completedCoursesWithFinal: rawUser.completedCoursesWithFinal || user?.completedCoursesWithFinal,
      completedCoursesWithoutFinal: rawUser.completedCoursesWithoutFinal || user?.completedCoursesWithoutFinal,
      specialization: rawUser.specialization || rawUser.categoria || user?.specialization || user?.categoria,
      isTutor: rawUser.isTutor !== undefined ? !!rawUser.isTutor : !!user?.isTutor,
      createdAt: rawUser.createdAt || user?.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || new Date().toISOString(),
    };

    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      saveUsers(users);
    } else {
      saveUsers([...users, updatedUser]);
    }

    return updatedUser;
  } catch (error: any) {
    return rejectWithValue(error.message || 'Error al cambiar el estado del usuario');
  }
});

export const registerStudent = createAsyncThunk<
  User,
  {
    email: string;
    nombre: string;
    apellido: string;
    dni?: string;
    password?: string;
    yearOfAdmission?: number;
    completedCoursesWithFinal?: number;
    completedCoursesWithoutFinal?: number;
  },
  { rejectValue: string }
>('users/register', async (payload, { rejectWithValue, signal }) => {
  try {
    const response = await authService.registerStudent(payload, signal);
    const data = await response.json();

    if (!response.ok) {
      const serverErrorMessage = (data && (data.message || data.error)) || '';
      const isOnlyWelcomeEmailFailure =
        typeof serverErrorMessage === 'string' &&
        (serverErrorMessage.toLowerCase().includes('correo de bienvenida') ||
          serverErrorMessage.toLowerCase().includes('email de bienvenida') ||
          serverErrorMessage.toLowerCase().includes('mail de bienvenida') ||
          (serverErrorMessage.toLowerCase().includes('bienvenida') &&
            (serverErrorMessage.toLowerCase().includes('correo') ||
              serverErrorMessage.toLowerCase().includes('email') ||
              serverErrorMessage.toLowerCase().includes('enviar'))));

      if (!isOnlyWelcomeEmailFailure) {
        return rejectWithValue(data?.message || 'Error al registrar el estudiante');
      }
    }

    const rawUser = data.user || data.student || data || {};
    const userRoles = Array.isArray(rawUser.roles)
      ? rawUser.roles
      : (rawUser.rol ? [rawUser.rol] : ['ESTUDIANTE']);

    const mappedUser: User = {
      id: rawUser.id || rawUser._id || crypto.randomUUID(),
      email: rawUser.email || payload.email,
      nombre: rawUser.firstName || rawUser.nombre || payload.nombre,
      apellido: rawUser.lastName || rawUser.apellido || payload.apellido,
      rol: (userRoles[0] as UserRole) || 'ESTUDIANTE',
      estado: rawUser.estado || 'active',
      dni: rawUser.dni || payload.dni,
      yearOfAdmission: rawUser.yearOfAdmission !== undefined ? Number(rawUser.yearOfAdmission) : payload.yearOfAdmission,
      completedCoursesWithFinal: rawUser.completedCoursesWithFinal !== undefined ? Number(rawUser.completedCoursesWithFinal) : payload.completedCoursesWithFinal,
      completedCoursesWithoutFinal: rawUser.completedCoursesWithoutFinal !== undefined ? Number(rawUser.completedCoursesWithoutFinal) : payload.completedCoursesWithoutFinal,
      createdAt: rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || new Date().toISOString(),
    };

    const users = loadUsers();
    const updated = [...users, mappedUser];
    saveUsers(updated);

    return mappedUser;
  } catch (error: any) {
    if (signal?.aborted) return rejectWithValue('Petición cancelada');
    return rejectWithValue(error instanceof Error ? error.message : 'Error al registrar el estudiante');
  }
});

export const registerProfessor = createAsyncThunk<
  User,
  {
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    password?: string;
    specialization: string;
    isTutor: boolean;
  },
  { rejectValue: string }
>('users/registerProfessor', async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await userService.registerProfessor(payload, token);
    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || 'Error al registrar el docente');
    }

    const rawUser = data.user || data || {};
    const userRoles = Array.isArray(rawUser.roles)
      ? rawUser.roles
      : (rawUser.rol ? [rawUser.rol] : ['DOCENTE']);

    const mappedUser: User = {
      id: String(rawUser.id || rawUser._id || crypto.randomUUID()),
      email: rawUser.email || payload.email,
      nombre: rawUser.firstName || rawUser.nombre || payload.nombre,
      apellido: rawUser.lastName || rawUser.apellido || payload.apellido,
      rol: (userRoles[0] as UserRole) || 'DOCENTE',
      estado: rawUser.estado || 'active',
      dni: rawUser.dni || payload.dni,
      categoria: rawUser.specialization || payload.specialization,
      isTutor: rawUser.isTutor !== undefined ? Boolean(rawUser.isTutor) : Boolean(payload.isTutor),
      password: payload.password,
      createdAt: rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || new Date().toISOString(),
    };

    const users = loadUsers();
    const existingIndex = users.findIndex(
      (u) => u.email?.toLowerCase().trim() === mappedUser.email?.toLowerCase().trim()
    );
    let updatedUserList: User[];
    if (existingIndex >= 0) {
      updatedUserList = [...users];
      updatedUserList[existingIndex] = { ...updatedUserList[existingIndex], ...mappedUser };
    } else {
      updatedUserList = [...users, mappedUser];
    }
    saveUsers(updatedUserList);

    return mappedUser;
  } catch (error: any) {
    return rejectWithValue(error instanceof Error ? error.message : 'Error al registrar el docente');
  }
});

export const registerAdmin = createAsyncThunk<
  User,
  {
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    password?: string;
  },
  { rejectValue: string }
>('users/registerAdmin', async (payload, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const response = await userService.registerAdmin(payload, token);
    const data = await response.json();

    if (!response.ok) {
      return rejectWithValue(data.message || 'Error al registrar el administrador');
    }

    const rawUser = data.user || data || {};
    const mappedUser: User = {
      id: rawUser.id || rawUser._id || crypto.randomUUID(),
      email: rawUser.email || payload.email,
      nombre: rawUser.firstName || rawUser.nombre || payload.nombre,
      apellido: rawUser.lastName || rawUser.apellido || payload.apellido,
      rol: 'ADMIN',
      estado: rawUser.estado || 'active',
      dni: rawUser.dni || payload.dni,
      createdAt: rawUser.createdAt || new Date().toISOString(),
      updatedAt: rawUser.updatedAt || new Date().toISOString(),
    };

    const users = loadUsers();
    saveUsers([...users, mappedUser]);
    return mappedUser;
  } catch (error: any) {
    return rejectWithValue(error instanceof Error ? error.message : 'Error al registrar el administrador');
  }
});

export const approveUser = createAsyncThunk<User, { id: string }>('users/approve', async ({ id }) => {
  await new Promise((r) => setTimeout(r, 200));
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuario no encontrado');
  const dni = users[idx].dni || '';
  const tempPassword = dni ? `DNI${dni}` : 'alumno123';
  users[idx] = { ...users[idx], estado: 'active', password: tempPassword, mustChangePassword: true, updatedAt: new Date().toISOString() };
  saveUsers(users);
  return users[idx];
});

export const rejectUser = createAsyncThunk<User, { id: string }>('users/reject', async ({ id }) => {
  await new Promise((r) => setTimeout(r, 200));
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuario no encontrado');
  users[idx] = { ...users[idx], estado: 'rejected', updatedAt: new Date().toISOString() };
  saveUsers(users);
  return users[idx];
});

export const deleteUser = createAsyncThunk<string, { id: string }>('users/delete', async ({ id }) => {
  await new Promise((r) => setTimeout(r, 200));
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuario no encontrado');
  users[idx] = { ...users[idx], estado: 'papelera', updatedAt: new Date().toISOString() };
  saveUsers(users);
  return id;
});

export const resetPassword = createAsyncThunk<User, { id: string }, { rejectValue: string }>(
  'users/resetPassword',
  async ({ id }, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 200));
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return rejectWithValue('Usuario no encontrado');
    }
    const dni = users[idx].dni;
    if (!dni) {
      return rejectWithValue('El usuario no tiene DNI para generar la contraseña');
    }
    users[idx] = { ...users[idx], password: `DNI${dni}`, updatedAt: new Date().toISOString() };
    saveUsers(users);
    return users[idx];
  }
);

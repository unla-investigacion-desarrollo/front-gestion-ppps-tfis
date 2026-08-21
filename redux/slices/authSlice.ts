import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../src/services/authService';

// Un slice es una porción del store que maneja un dominio específico del estado. 
// En este caso, authSlice maneja todo lo relacionado con la autenticación.

// Tipos
interface User {
  id: string;
  email: string;
  name: string;
  roles?: string[];
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  lastLogin: string | null;
}

// Helper para normalizar un rol en mayúsculas y mapear variantes
const normalizeRole = (role: any): string => {
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
    case 'SUPER_ADMIN':
      // Compatibilidad con tokens antiguos: el rol único de administración es ADMIN.
      return 'ADMIN';
    case 'DOCENTE':
    case 'ESTUDIANTE':
      return roleStr;
    default:
      return roleStr;
  }
};

const normalizeRoles = (rolesSource: any): string[] => {
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

// Estado inicial
const initialState: AuthState = {
  user: (() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      const persistedRoles = parsed.roles || parsed.rol || [];
      return parsed ? { ...parsed, roles: normalizeRoles(persistedRoles) } : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: 'idle',
  error: null,
  lastLogin: localStorage.getItem('lastLogin') || null,
};

// Función auxiliar para decodificar un token JWT en el cliente
const decodeJwt = (token: string): any => {
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

// Thunk para el login con el backend real
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error en el inicio de sesión');
      }

      const token = data.token;

      if (!token) {
        return rejectWithValue('No se recibió el token del servidor');
      }

      // Decodificar el token JWT para extraer la información del usuario
      const decoded = decodeJwt(token) || {};

      const email = data.email || decoded.email || decoded.sub || credentials.email;

      // Intentar obtener los roles del JWT (pueden venir como array de strings, string separado por comas, u objeto)
      const rolesSource = decoded.roles || decoded.role || decoded.rol || decoded.authorities || [];
      const normalizedRoles = normalizeRoles(rolesSource);

      // Si no se encuentran roles en el JWT, usar 'ESTUDIANTE' como valor por defecto
      const finalRoles = normalizedRoles.length > 0 ? normalizedRoles : ['ESTUDIANTE'];

      const mappedUser: User = {
        id: decoded.id || decoded.sub || email,
        email: email,
        name: decoded.name || decoded.nombre || [decoded.firstName, decoded.lastName].filter(Boolean).join(' ') || email.split('@')[0] || 'Usuario',
        roles: finalRoles,
        mustChangePassword: !!(decoded.mustChangePassword || data.mustChangePassword),
      };

      // Guardar token y usuario en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      localStorage.setItem('lastLogin', new Date().toISOString());

      return { user: mappedUser, token };
    } catch (error) {
      console.error('Error en login:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Error de conexión con el servidor');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Cerrar sesión
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.lastLogin = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastLogin');
      state.token = null;
      state.loading = 'idle';
      state.error = null;
      state.lastLogin = null;
      localStorage.removeItem('token');
      localStorage.removeItem('lastLogin');
    },
    // Limpiar errores
    clearError: (state) => {
      state.error = null;
    },
    setMustChangePassword: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, mustChangePassword: action.payload } as any;
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            u.mustChangePassword = action.payload;
            localStorage.setItem('user', JSON.stringify(u));
          } catch { }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.lastLogin = new Date().toISOString();
        // Actualizar localStorage con la información del usuario
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('lastLogin', state.lastLogin);
        // Mover una notificación pendiente del usuario a sessionStorage para mostrar como toast
        try {
          const userId = action.payload.user?.id as string | undefined;
          if (userId) {
            const key = 'userNotifications';
            const raw = localStorage.getItem(key);
            if (raw) {
              const map = JSON.parse(raw) as Record<string, string[]>;
              const list = Array.isArray(map[userId]) ? map[userId] : [];
              if (list.length > 0) {
                const message = list.shift() as string;
                map[userId] = list;
                localStorage.setItem(key, JSON.stringify(map));
                sessionStorage.setItem(`toast:${userId}`, message);
              }
            }
          }
        } catch {
          // ignorar errores de almacenamiento
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = (action.payload as string) ?? 'Error desconocido';
        // Limpiar localStorage en caso de error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastLogin');
      });
  },
});

// Exportar acciones y reducer
export const { logout, clearError, setMustChangePassword } = authSlice.actions;
export default authSlice.reducer;

// Selectores
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
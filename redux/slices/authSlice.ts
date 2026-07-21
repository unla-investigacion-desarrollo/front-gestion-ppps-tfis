import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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

// Estado inicial
const initialState: AuthState = {
  user: (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
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

// Thunk para el login con el backend real
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || '/api/sg-ppp-tfi/v1').replace(/\/$/, '');
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error en el inicio de sesión');
      }

      const rawUser = data.user || {};
      const userRoles = Array.isArray(rawUser.roles)
        ? rawUser.roles
        : (rawUser.rol ? [rawUser.rol] : []);

      const mappedUser: User = {
        id: rawUser.id || rawUser._id,
        email: rawUser.email,
        name: rawUser.name || [rawUser.nombre, rawUser.apellido].filter(Boolean).join(' ') || rawUser.email,
        roles: userRoles,
        mustChangePassword: !!rawUser.mustChangePassword,
      };

      const token = data.token;

      if (!token) {
        return rejectWithValue('No se recibió el token del servidor');
      }

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
          } catch {}
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
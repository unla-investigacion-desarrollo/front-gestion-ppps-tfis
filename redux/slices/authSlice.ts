import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Un slice es una porción del store que maneja un dominio específico del estado. 
// En este caso, authSlice maneja todo lo relacionado con la autenticación.

// Tipos
interface User {
  id: string;
  email: string;
  name: string;
  roles?: string[];
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
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: 'idle',
  error: null,
  lastLogin: localStorage.getItem('lastLogin') || null,
};

// Thunk para el login con credenciales falsas
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Cuando euge tenga el backend listo, se debe quitar el codigo de abajo y usar el de arriba
      /* const response = await fetch('tu-api-endpoint/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error en el inicio de sesión');
      }

      return { user: data.user, token: data.token }; 
    } catch {
      return rejectWithValue('Error de conexión');*/
      
      // Credenciales de prueba
      const testCredentials = {
        email: 'admin@example.com',
        password: 'admin123'
      };

      // Simular retraso de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar credenciales
      if (credentials.email === testCredentials.email && 
          credentials.password === testCredentials.password) {
        // Usuario de prueba
        const mockUser = {
          id: '1',
          email: credentials.email,
          name: 'Usuario de Prueba',
          roles: ['admin']
        };
        
        // Token simulado
        const mockToken = 'mock-jwt-token';
        
        // Guardar token en localStorage
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('lastLogin', new Date().toISOString());
        
        return { 
          user: mockUser, 
          token: mockToken 
        };
      } else {
        // Intento de login contra usuarios del mock en localStorage
        const raw = localStorage.getItem('users');
        const users: any[] = raw ? JSON.parse(raw) : [];
        const found = users.find(u => (u.email || '').toLowerCase() === credentials.email.toLowerCase());
        if (!found) {
          return rejectWithValue('Usuario no encontrado');
        }
        if (found.estado !== 'active') {
          return rejectWithValue('Usuario no activo. Requiere aprobación.');
        }
        if (!found.password || found.password !== credentials.password) {
          return rejectWithValue('Contraseña incorrecta');
        }

        const roleMap: Record<string, string> = {
          'DOCENTE': 'docente',
          'ESTUDIANTE': 'estudiante',
          'ADMIN': 'admin',
          'SUPER_ADMIN': 'admin',
        };
        const mappedRole = roleMap[found.rol] || 'estudiante';
        const mockUser = {
          id: found.id,
          email: found.email,
          name: [found.nombre, found.apellido].filter(Boolean).join(' ') || found.email,
          roles: [mappedRole],
        };
        const mockToken = 'mock-jwt-token';
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('lastLogin', new Date().toISOString());
        return { user: mockUser, token: mockToken };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return rejectWithValue('Error en el servidor');
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
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload ?? 'Error desconocido';
        // Limpiar localStorage en caso de error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastLogin');
      });
  },
});

// Exportar acciones y reducer
export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

// Selectores
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => 
  state.auth.isAuthenticated;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
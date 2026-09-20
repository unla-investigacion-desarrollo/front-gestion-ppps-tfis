import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginUser, User, normalizeRoles } from './asyncActions';

export type { User };

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  lastLogin: string | null;
}

export const initialState: AuthState = {
  user: (() => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as User;
      const persistedRoles = parsed.roles || (parsed as any).rol || [];
      return parsed ? { ...parsed, roles: normalizeRoles(persistedRoles) } : null;
    } catch {
      return null;
    }
  })(),
  token: typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? !!localStorage.getItem('token') : false,
  loading: 'idle',
  error: null,
  lastLogin: typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('lastLogin') || null : null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.lastLogin = null;
      state.loading = 'idle';
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastLogin');
    },
    clearError: (state) => {
      state.error = null;
    },
    setMustChangePassword: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user = { ...state.user, mustChangePassword: action.payload };
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const u = JSON.parse(stored);
            u.mustChangePassword = action.payload;
            localStorage.setItem('user', JSON.stringify(u));
          } catch {}
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
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
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('lastLogin', state.lastLogin);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = (action.payload as string) || action.error.message || 'Error desconocido';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('lastLogin');
      });
  },
});

export const { logout, clearError, setMustChangePassword } = authSlice.actions;

// Selectores tipados
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;

export * from './asyncActions';
export default authSlice.reducer;

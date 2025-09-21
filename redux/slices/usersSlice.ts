import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE';
export type UserStatus = 'pending' | 'active' | 'rejected' | 'invited' | 'disabled';

export interface User {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  rol: UserRole;
  estado: UserStatus;
  dni?: string;
  fechaNacimiento?: string; // ISO string YYYY-MM-DD
  cuil?: string;
  sexo?: 'F' | 'M';
  legajo?: string;
  carrera?: string;
  departamento?: string;
  categoria?: string;
  password?: string; // solo mock
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface UsersState {
  list: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const STORAGE_KEY = 'users';

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

const initialState: UsersState = {
  list: loadUsers(),
  status: 'idle',
  error: null,
};

export const fetchUsers = createAsyncThunk<User[]>('users/fetch', async () => {
  // Mock: read from localStorage
  await new Promise((r) => setTimeout(r, 300));
  return loadUsers();
});

export const registerStudent = createAsyncThunk<
  User,
  { email: string; nombre?: string; apellido?: string; legajo?: string; carrera?: string; dni: string; fechaNacimiento: string; cuil: string; sexo: 'F' | 'M' }
>('users/registerStudent', async (payload) => {
  await new Promise((r) => setTimeout(r, 300));
  const users = loadUsers();
  const duplicateEmail = users.some((u) => (u.email || '').toLowerCase() === payload.email.toLowerCase());
  const duplicateDni = users.some((u) => (u.dni || '') === payload.dni);
  if (duplicateEmail || duplicateDni) {
    throw new Error('El usuario ya se encuentra registrado. Si olvidaste tu contraseña, solicitá al administrador el reseteo.');
  }
  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    email: payload.email,
    nombre: payload.nombre,
    apellido: payload.apellido,
    rol: 'ESTUDIANTE',
    estado: 'pending',
    dni: payload.dni,
    fechaNacimiento: payload.fechaNacimiento,
    cuil: payload.cuil,
    sexo: payload.sexo,
    legajo: payload.legajo,
    carrera: payload.carrera,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...users, user];
  saveUsers(updated);
  return user;
});

export const createOrInviteTeacher = createAsyncThunk<
  User,
  { email: string; nombre?: string; apellido?: string; departamento?: string; categoria?: string; invite?: boolean; createdBy?: string; password?: string; dni?: string; sexo?: 'F' | 'M' }
>('users/createOrInviteTeacher', async (payload) => {
  await new Promise((r) => setTimeout(r, 300));
  const users = loadUsers();
  const exists = users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (exists) {
    throw new Error('El email ya está registrado');
  }
  if (payload.dni) {
    const duplicateDni = users.some((u) => (u.dni || '') === payload.dni);
    if (duplicateDni) {
      throw new Error('El DNI ya se encuentra registrado');
    }
  }
  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    email: payload.email,
    nombre: payload.nombre,
    apellido: payload.apellido,
    rol: 'DOCENTE',
    estado: payload.invite ? 'invited' : 'active',
    dni: payload.dni,
    sexo: payload.sexo,
    departamento: payload.departamento,
    categoria: payload.categoria,
    createdAt: now,
    updatedAt: now,
    createdBy: payload.createdBy,
  };
  if (!payload.invite && payload.password) {
    user.password = payload.password;
  }
  const updated = [...users, user];
  saveUsers(updated);
  return user;
});

export const approveUser = createAsyncThunk<User, { id: string }>('users/approve', async ({ id }) => {
  await new Promise((r) => setTimeout(r, 200));
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error('Usuario no encontrado');
  const dni = users[idx].dni || '';
  const tempPassword = dni ? `DNI${dni}` : 'alumno123';
  users[idx] = { ...users[idx], estado: 'active', password: tempPassword, updatedAt: new Date().toISOString() };
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
  const updated = users.filter(u => u.id !== id);
  saveUsers(updated);
  return id;
});

export const resetPassword = createAsyncThunk<User, { id: string }>('users/resetPassword', async ({ id }, { rejectWithValue }) => {
  await new Promise((r) => setTimeout(r, 200));
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return rejectWithValue('Usuario no encontrado') as any;
  }
  const dni = users[idx].dni;
  if (!dni) {
    return rejectWithValue('El usuario no tiene DNI para generar la contraseña') as any;
  }
  users[idx] = { ...users[idx], password: `DNI${dni}`, updatedAt: new Date().toISOString() };
  saveUsers(users);
  return users[idx];
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Error al cargar usuarios';
      })
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(createOrInviteTeacher.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(rejectUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter(u => u.id !== action.payload);
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export default usersSlice.reducer;

export const selectUsers = (state: any) => state.users.list as User[];
export const selectPendingUsers = (state: any) => (state.users.list as User[]).filter(u => u.estado === 'pending');
export const selectUsersStatus = (state: any) => state.users.status as UsersState['status'];
export const selectUsersError = (state: any) => state.users.error as string | null;

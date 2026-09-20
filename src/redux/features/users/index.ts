import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  User,
  UserRole,
  UserStatus,
  loadUsers,
  saveUsers,
  fetchUsers,
  registerStudent,
  registerProfessor,
  createOrInviteTeacher,
  approveUser,
  rejectUser,
  deleteUser,
  resetPassword,
  activateInvitedTeacher,
  toggleUserActivation,
  changePassword,
} from './asyncActions';

export type { User, UserRole, UserStatus };

export interface UsersState {
  list: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

export const initialState: UsersState = {
  list: [],
  status: 'idle',
  error: null,
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.status = 'succeeded';
        state.list = action.payload;
        const localUsers = loadUsers();
        const merged = [...action.payload];
        localUsers.forEach((lu) => {
          const idx = merged.findIndex(
            (m) => m.email?.toLowerCase().trim() === lu.email?.toLowerCase().trim() || m.id === lu.id
          );
          if (idx >= 0) {
            merged[idx] = {
              ...lu,
              ...merged[idx],
              isTutor: merged[idx].isTutor !== undefined ? merged[idx].isTutor : lu.isTutor,
            };
          } else {
            merged.push(lu);
          }
        });
        saveUsers(merged);
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Error al cargar usuarios';
      })
      .addCase(registerStudent.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerStudent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list.push(action.payload);
        state.error = null;
      })
      .addCase(registerStudent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Error al registrar el estudiante';
      })
      .addCase(registerProfessor.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerProfessor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list.push(action.payload);
        state.error = null;
      })
      .addCase(registerProfessor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || 'Error al registrar el docente';
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
        const idx = state.list.findIndex((u) => u.id === action.payload);
        if (idx !== -1) state.list[idx].estado = 'papelera';
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(activateInvitedTeacher.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(toggleUserActivation.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], mustChangePassword: false };
        }
      });
  },
});

export const { clearUsersError } = usersSlice.actions;

// Selectores tipados
export const selectUsers = (state: { users: UsersState }) => state.users.list;
export const selectPendingUsers = createSelector(
  [selectUsers],
  (list) => list.filter((u) => u.estado === 'pending')
);
export const selectUsersStatus = (state: { users: UsersState }) => state.users.status;
export const selectUsersError = (state: { users: UsersState }) => state.users.error;

export * from './asyncActions';
export default usersSlice.reducer;

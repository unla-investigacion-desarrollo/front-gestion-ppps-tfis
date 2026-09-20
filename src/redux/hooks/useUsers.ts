import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  selectUsers,
  selectPendingUsers,
  selectUsersStatus,
  selectUsersError,
  clearUsersError,
} from '../features/users';
import {
  fetchUsers,
  registerStudent,
  registerProfessor,
  registerAdmin,
  createOrInviteTeacher,
  activateInvitedTeacher,
  toggleUserActivation,
  approveUser,
  rejectUser,
  deleteUser,
  changePassword,
  resetPassword,
  User,
  UserRole,
} from '../features/users/asyncActions';

export const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const pendingUsers = useAppSelector(selectPendingUsers);
  const status = useAppSelector(selectUsersStatus);
  const error = useAppSelector(selectUsersError);

  const loadUsers = useCallback(() => {
    return dispatch(fetchUsers()).unwrap();
  }, [dispatch]);

  const registerStudentUser = useCallback(
    (payload: {
      email: string;
      nombre: string;
      apellido: string;
      dni?: string;
      password?: string;
      yearOfAdmission?: number;
      completedCoursesWithFinal?: number;
      completedCoursesWithoutFinal?: number;
    }) => {
      return dispatch(registerStudent(payload)).unwrap();
    },
    [dispatch]
  );

  const registerProfessorUser = useCallback(
    (payload: {
      email: string;
      nombre: string;
      apellido: string;
      dni: string;
      password?: string;
      specialization: string;
      isTutor: boolean;
    }) => {
      return dispatch(registerProfessor(payload)).unwrap();
    },
    [dispatch]
  );

  const registerAdminUser = useCallback(
    (payload: {
      email: string;
      nombre: string;
      apellido: string;
      dni: string;
      password?: string;
    }) => {
      return dispatch(registerAdmin(payload)).unwrap();
    },
    [dispatch]
  );

  const inviteTeacher = useCallback(
    (payload: {
      email: string;
      nombre?: string;
      apellido?: string;
      invite?: boolean;
      createdBy?: string;
      password?: string;
      dni?: string;
      sexo?: 'F' | 'M';
      rol?: Extract<UserRole, 'DOCENTE' | 'ADMIN'>;
    }) => {
      return dispatch(createOrInviteTeacher(payload)).unwrap();
    },
    [dispatch]
  );

  const activateTeacher = useCallback(
    (id: string, password: string) => {
      return dispatch(activateInvitedTeacher({ id, password })).unwrap();
    },
    [dispatch]
  );

  const toggleActivation = useCallback(
    (id: string, enable: boolean, user?: User) => {
      return dispatch(toggleUserActivation({ id, enable, user })).unwrap();
    },
    [dispatch]
  );

  const approveUserById = useCallback(
    (id: string) => {
      return dispatch(approveUser({ id })).unwrap();
    },
    [dispatch]
  );

  const rejectUserById = useCallback(
    (id: string) => {
      return dispatch(rejectUser({ id })).unwrap();
    },
    [dispatch]
  );

  const deleteUserById = useCallback(
    (id: string) => {
      return dispatch(deleteUser({ id })).unwrap();
    },
    [dispatch]
  );

  const changeUserPassword = useCallback(
    (id: string, currentPassword: string, newPassword: string) => {
      return dispatch(changePassword({ id, currentPassword, newPassword })).unwrap();
    },
    [dispatch]
  );

  const resetUserPassword = useCallback(
    (id: string) => {
      return dispatch(resetPassword({ id })).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearUsersError());
  }, [dispatch]);

  return {
    users,
    pendingUsers,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'succeeded',
    isError: status === 'failed',
    error,
    loadUsers,
    registerStudentUser,
    registerProfessorUser,
    registerAdminUser,
    inviteTeacher,
    activateTeacher,
    toggleActivation,
    approveUserById,
    rejectUserById,
    deleteUserById,
    changeUserPassword,
    resetUserPassword,
    clearError,
  };
};

export default useUsers;

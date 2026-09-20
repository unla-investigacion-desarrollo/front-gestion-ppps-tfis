import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  logout,
  clearError,
  setMustChangePassword,
} from '../features/auth';
import { loginUser } from '../features/auth/asyncActions';

export const useAuthDomain = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const login = useCallback(
    (credentials: { email: string; password: string }) => {
      return dispatch(loginUser(credentials)).unwrap();
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const updateMustChangePassword = useCallback(
    (mustChange: boolean) => {
      dispatch(setMustChangePassword(mustChange));
    },
    [dispatch]
  );

  return {
    currentUser,
    isAuthenticated,
    loading,
    isLoading: loading === 'pending',
    isSuccess: loading === 'succeeded',
    isError: loading === 'failed',
    error,
    login,
    logout: logoutUser,
    clearError: clearAuthError,
    setMustChangePassword: updateMustChangePassword,
  };
};

export default useAuthDomain;

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  selectProjects,
  selectProjectTypes,
  selectProjectsStatus,
  selectProjectsError,
  selectPendingProjectRequests,
  selectPendingProjectRequestsStatus,
  selectPendingProjectRequestsError,
  clearProjectsError,
} from '../features/projects';
import {
  fetchProjects,
  fetchPendingProjectRequests,
  fetchProjectTypes,
  createProject,
  updateProject,
  deleteProject,
  assignStudentToProject,
  removeStudentFromProject,
  addCoTeacher,
  removeCoTeacher,
  approveStudentProjectRequest,
  rejectStudentProjectRequest,
  approveProfessorProjectRequest,
  rejectProfessorProjectRequest,
} from '../features/projects/asyncActions';

export const useProjects = () => {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(selectProjects);
  const projectTypes = useAppSelector(selectProjectTypes);
  const status = useAppSelector(selectProjectsStatus);
  const error = useAppSelector(selectProjectsError);

  const pendingRequests = useAppSelector(selectPendingProjectRequests);
  const pendingRequestsStatus = useAppSelector(selectPendingProjectRequestsStatus);
  const pendingRequestsError = useAppSelector(selectPendingProjectRequestsError);

  const loadProjects = useCallback(() => {
    return dispatch(fetchProjects()).unwrap();
  }, [dispatch]);

  const loadPendingRequests = useCallback(() => {
    return dispatch(fetchPendingProjectRequests()).unwrap();
  }, [dispatch]);

  const loadProjectTypes = useCallback(() => {
    return dispatch(fetchProjectTypes()).unwrap();
  }, [dispatch]);

  const createNewProject = useCallback(
    (payload: {
      teacherId?: string;
      titulo: string;
      descripcion: string;
      categoria?: string;
      projectTypeId?: number;
      customProjectType?: string;
      estado?: string;
    }) => {
      return dispatch(createProject(payload)).unwrap();
    },
    [dispatch]
  );

  const updateExistingProject = useCallback(
    (payload: {
      projectId: string | number;
      titulo: string;
      descripcion: string;
      projectTypeId?: number;
    }) => {
      return dispatch(updateProject(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteProjectById = useCallback(
    (projectId: string) => {
      return dispatch(deleteProject({ projectId })).unwrap();
    },
    [dispatch]
  );

  const assignStudent = useCallback(
    (projectId: string, studentId: string) => {
      return dispatch(assignStudentToProject({ projectId, studentId })).unwrap();
    },
    [dispatch]
  );

  const removeStudent = useCallback(
    (projectId: string, studentId: string) => {
      return dispatch(removeStudentFromProject({ projectId, studentId })).unwrap();
    },
    [dispatch]
  );

  const addTeacherToProject = useCallback(
    (projectId: string, teacherId: string) => {
      return dispatch(addCoTeacher({ projectId, teacherId })).unwrap();
    },
    [dispatch]
  );

  const removeTeacherFromProject = useCallback(
    (projectId: string, teacherId: string) => {
      return dispatch(removeCoTeacher({ projectId, teacherId })).unwrap();
    },
    [dispatch]
  );

  const approveStudentRequest = useCallback(
    (projectId: string, studentUserId: string) => {
      return dispatch(approveStudentProjectRequest({ projectId, studentUserId })).unwrap();
    },
    [dispatch]
  );

  const rejectStudentRequest = useCallback(
    (projectId: string, studentUserId: string) => {
      return dispatch(rejectStudentProjectRequest({ projectId, studentUserId })).unwrap();
    },
    [dispatch]
  );

  const approveProfessorRequest = useCallback(
    (projectId: string, professorUserId: string) => {
      return dispatch(approveProfessorProjectRequest({ projectId, professorUserId })).unwrap();
    },
    [dispatch]
  );

  const rejectProfessorRequest = useCallback(
    (projectId: string, professorUserId: string) => {
      return dispatch(rejectProfessorProjectRequest({ projectId, professorUserId })).unwrap();
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearProjectsError());
  }, [dispatch]);

  return {
    projects,
    projectTypes,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'succeeded',
    isError: status === 'failed',
    error,
    pendingRequests,
    pendingRequestsStatus,
    isPendingRequestsLoading: pendingRequestsStatus === 'loading',
    pendingRequestsError,
    loadProjects,
    loadPendingRequests,
    loadProjectTypes,
    createNewProject,
    updateExistingProject,
    deleteProjectById,
    assignStudent,
    removeStudent,
    addTeacherToProject,
    removeTeacherFromProject,
    approveStudentRequest,
    rejectStudentRequest,
    approveProfessorRequest,
    rejectProfessorRequest,
    clearError,
  };
};

export default useProjects;

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';

// Permite acceso a usuarios con rol docente (profesor/evaluador/tutor) o administrador.
const TeacherRoute = ({ children }) => {
  const { isProfessor, isAdmin, user, loading } = useUserProfile();
  if (loading && !user) {
    return null;
  }
  const isTeacherOrAbove = isProfessor || isAdmin;
  return isTeacherOrAbove ? children : <Navigate to="/dashboard" />;
};

export default TeacherRoute;

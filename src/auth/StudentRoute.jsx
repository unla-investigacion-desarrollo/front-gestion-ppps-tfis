import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Permite acceso solo a estudiantes (bloquea docentes y administradores)
const StudentRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isTeacherOrAbove = roles.includes('DOCENTE') || roles.includes('admin') || roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  return !isTeacherOrAbove ? children : <Navigate to="/dashboard" />;
};

export default StudentRoute;

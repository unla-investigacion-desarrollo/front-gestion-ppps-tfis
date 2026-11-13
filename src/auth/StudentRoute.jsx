import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { normalizeRole } from '../redux/features/auth/asyncActions';

// Permite acceso solo a estudiantes (bloquea docentes y administradores)
const StudentRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const roles = Array.isArray(user?.roles) ? [...user.roles] : user?.roles ? [user.roles] : [];
  if (user?.role) roles.push(user.role);
  if (user?.rol) roles.push(user.rol);
  const normalizedRoles = roles.map(normalizeRole);
  const isTeacherOrAbove = normalizedRoles.some((r) => [
    'DOCENTE',
    'PROFESSOR',
    'ADMIN',
    'SUPERADMIN'
  ].includes(r));
  return !isTeacherOrAbove ? children : <Navigate to="/dashboard" />;
};

export default StudentRoute;

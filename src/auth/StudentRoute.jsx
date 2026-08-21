import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Permite acceso solo a estudiantes (bloquea docentes y administradores)
const StudentRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const roles = Array.isArray(user?.roles) ? [...user.roles] : user?.roles ? [user.roles] : [];
  if (user?.rol) roles.push(user.rol);
  const normalizedRoles = roles.map((r) => String(r).toUpperCase().trim());
  const isTeacherOrAbove = normalizedRoles.some((r) => [
    'DOCENTE',
    'TEACHER',
    'PROFESSOR',
    'ADMIN',
    'ADMINISTRADOR'
  ].includes(r));
  return !isTeacherOrAbove ? children : <Navigate to="/dashboard" />;
};

export default StudentRoute;

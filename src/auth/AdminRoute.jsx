import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = !!user && Array.isArray(user.roles) && (
    user.roles.includes('admin') ||
    user.roles.includes('ADMIN') ||
    user.roles.includes('ADMINISTRADOR')
  );
  return isAdmin ? children : <Navigate to="/dashboard" />;
};

export default AdminRoute;

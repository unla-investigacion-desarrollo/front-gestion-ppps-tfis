import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Simple admin guard: allows if user has role 'admin' (from authSlice mock)
// or has 'ADMIN'/'SUPER_ADMIN' in roles if you later align roles.
const AdminRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = !!user && Array.isArray(user.roles) && (
    user.roles.includes('admin') ||
    user.roles.includes('ADMIN') ||
    user.roles.includes('SUPER_ADMIN')
  );
  return isAdmin ? children : <Navigate to="/dashboard" />;
};

export default AdminRoute;

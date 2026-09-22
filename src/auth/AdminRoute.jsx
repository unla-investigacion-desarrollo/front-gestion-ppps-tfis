import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';

const AdminRoute = ({ children }) => {
  const { isAdmin, user, loading } = useUserProfile();
  if (loading && !user) {
    return null;
  }
  return isAdmin ? children : <Navigate to="/dashboard" />;
};

export default AdminRoute;

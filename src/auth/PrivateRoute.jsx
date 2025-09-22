import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
};

export default PrivateRoute;
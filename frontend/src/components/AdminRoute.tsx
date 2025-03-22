import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check if user has admin or manager role
  if (user && (user.role === 'admin' || user.role === 'manager')) {
    return <>{children}</>;
  }

  // Redirect to home page if authenticated but not admin/manager
  return <Navigate to="/" replace />;
};

export default AdminRoute; 
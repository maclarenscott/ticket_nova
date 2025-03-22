import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'manager' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user' 
}) => {
  const { isAuthenticated, isAdmin, isManager } = useContext(AuthContext);
  
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (requiredRole === 'admin' && !isAdmin()) {
    // Redirect to home page if not admin
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole === 'manager' && !isManager()) {
    // Redirect to home page if not manager
    return <Navigate to="/" replace />;
  }
  
  // Return children if authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute; 
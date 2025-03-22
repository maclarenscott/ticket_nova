import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Add comprehensive debug logging
  useEffect(() => {
    console.log("PrivateRoute - Auth check for path:", location.pathname, {
      isAuthenticated: typeof isAuthenticated === 'function' ? isAuthenticated() : isAuthenticated,
      isAuthenticatedType: typeof isAuthenticated,
      loadingState: isLoading,
      allowedRoles,
      user,
      userRole: user?.role
    });
  }, [isAuthenticated, user, isLoading, location.pathname, allowedRoles]);

  // If authentication is still loading, show nothing
  if (isLoading) {
    console.log("PrivateRoute - Still loading auth state");
    return (
      <div className="container text-center py-4">
        <div className="spinner"></div>
        <p className="mt-2">Loading...</p>
      </div>
    );
  }

  // IMPORTANT FIX: Check if isAuthenticated is a function and call it
  const isUserAuthenticated = typeof isAuthenticated === 'function' ? isAuthenticated() : isAuthenticated;
  
  // If user is not authenticated, redirect to login
  if (!isUserAuthenticated) {
    console.log("PrivateRoute - Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("PrivateRoute - User authenticated, checking roles:", { 
    userRole: user?.role, 
    allowedRoles,
    hasRequiredRole: allowedRoles ? allowedRoles.includes(user?.role || '') : true
  });

  // If roles are specified and user doesn't have the required role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log("PrivateRoute - User doesn't have required role, redirecting to unauthorized");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("PrivateRoute - Access granted to:", location.pathname);
  // If user is authenticated and has the required role, render the route
  return <Outlet />;
};

export default PrivateRoute; 
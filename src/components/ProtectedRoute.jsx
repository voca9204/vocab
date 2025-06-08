import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppState } from '../contexts/AppContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user } = useAppState();
  const location = useLocation();

  // Show loading while checking authentication status
  if (user.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user.isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;

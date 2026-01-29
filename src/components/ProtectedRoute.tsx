import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('patient' | 'asha_worker')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
        <div className="text-center">
          <div className="animate-pulse text-lg text-muted-foreground">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect based on user role
    if (profile.role === 'asha_worker') {
      return <Navigate to="/asha-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
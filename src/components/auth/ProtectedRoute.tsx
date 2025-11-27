import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Optional: set to true to require authentication
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = false }) => {
  const { isLoading } = useAuth();

  // Show loading state while checking auth (brief)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0c0a09] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#1C1917] dark:text-white mx-auto mb-4" />
          <p className="text-sm text-[#78716C] dark:text-stone-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication is now optional by default
  // Only redirect if requireAuth is explicitly set to true
  // (keeping the logic here but disabled for now)
  // if (requireAuth && !isAuthenticated) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;


import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Se verifică autentificarea...</p>
        </div>
      </div>
    );
  }

  // Allow access if user is authenticated (not anonymous)
  if (isAuthenticated) {
    return children;
  }

  // Redirect to auth page if not authenticated
  return <Navigate to="/auth" state={{ from: location }} replace />;
} 
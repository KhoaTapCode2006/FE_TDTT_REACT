import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Icon from '../ui/Icon.jsx';

/**
 * ProtectedRoute component for authentication guards
 * Redirects unauthenticated users to login page while preserving intended destination
 */
const ProtectedRoute = ({ 
  children, 
  redirectTo = '/auth/login',
  requireAuth = true,
  fallback = null 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Preserve the intended destination in location state
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If authentication is not required but user is authenticated (for auth pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Render children if authentication requirements are met
  return children;
};

/**
 * RequireAuth component - shorthand for protected routes that require authentication
 */
export const RequireAuth = ({ children, ...props }) => {
  return (
    <ProtectedRoute requireAuth={true} {...props}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * RequireGuest component - for routes that should only be accessible to non-authenticated users
 */
export const RequireGuest = ({ children, ...props }) => {
  return (
    <ProtectedRoute requireAuth={false} {...props}>
      {children}
    </ProtectedRoute>
  );
};

/**
 * ConditionalRoute component - renders different content based on authentication status
 */
export const ConditionalRoute = ({ 
  authenticatedComponent, 
  guestComponent, 
  loadingComponent = null 
}) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? authenticatedComponent : guestComponent;
};

/**
 * RoleBasedRoute component - for future role-based access control
 */
export const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  redirectTo = '/unauthorized' 
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface-variant text-sm">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/auth/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check role-based access (for future implementation)
  const userRole = user?.role || 'user';
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * AuthBoundary component - provides error boundary for authentication-related errors
 */
export class AuthBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Authentication boundary error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="error_outline" size={32} className="text-red-500" />
            </div>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-2">
              Authentication Error
            </h2>
            <p className="text-on-surface-variant text-sm mb-6">
              We're sorry, but there was an error with the authentication system. 
              Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full bg-surface-container text-on-surface py-2.5 rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for protecting components with authentication
 */
export const withAuth = (Component, options = {}) => {
  const WrappedComponent = (props) => {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Higher-order component for guest-only components
 */
export const withGuest = (Component, options = {}) => {
  const WrappedComponent = (props) => {
    return (
      <RequireGuest {...options}>
        <Component {...props} />
      </RequireGuest>
    );
  };

  WrappedComponent.displayName = `withGuest(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ProtectedRoute;
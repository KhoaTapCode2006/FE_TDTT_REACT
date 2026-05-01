import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.js';
import { authService } from '../services/authentication/auth.service.js';
import { profileService } from '../services/profile/profile.service.js';
import { sessionService } from '../services/profile/session.service.js';
import { ErrorLogger } from '../utils/errorHandling.js';

/**
 * Authentication Context
 */
const AuthContext = createContext({
  // User state
  user: null,
  loading: true,
  isAuthenticated: false,
  
  // Authentication methods
  login: async () => {},
  loginWithGoogle: async () => {},
  loginWithFacebook: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  
  // Profile methods
  updateProfile: async () => {},
  uploadAvatar: async () => {},
  
  // Session methods
  refreshSession: async () => {},
  
  // Error state
  error: null,
  clearError: () => {}
});

/**
 * Authentication Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle authentication state changes
   */
  const handleAuthStateChange = useCallback(async (firebaseUser) => {
    try {
      setLoading(true);
      
      if (firebaseUser) {
        // User is signed in
        const userProfile = await profileService.getProfile(firebaseUser.uid);
        
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          ...userProfile
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Update session activity
        sessionService.updateActivity();
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        
        // Clean up session
        sessionService.clearSession();
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      ErrorLogger.logAuthError(error, { action: 'auth_state_change' });
      setError('Failed to load user data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    let unsubscribe;
    
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const session = sessionService.getSession();
        
        if (session && sessionService.hasValidSession()) {
          // Valid session exists, wait for Firebase auth state
          setLoading(true);
        } else {
          // No valid session, clear any stale data
          sessionService.clearSession();
          setLoading(false);
        }
        
        // Set up Firebase auth state listener
        unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        ErrorLogger.logAuthError(error, { action: 'auth_initialization' });
        setError('Failed to initialize authentication. Please refresh the page.');
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up cross-tab session synchronization
    const handleStorageChange = (event) => {
      if (event.key === 'b4lu_session') {
        if (!event.newValue) {
          // Session cleared in another tab
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleAuthStateChange]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authService.loginWithEmail(email, password, rememberMe);
      
      // User state will be updated by the auth state listener
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'email_login',
        additionalData: { email, rememberMe }
      });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login with Google
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authService.loginWithGoogle();
      
      // User state will be updated by the auth state listener
      return userData;
    } catch (error) {
      console.error('Google login error:', error);
      ErrorLogger.logAuthError(error, { action: 'google_login' });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login with Facebook
   */
  const loginWithFacebook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await authService.loginWithFacebook();
      
      // User state will be updated by the auth state listener
      return userData;
    } catch (error) {
      console.error('Facebook login error:', error);
      ErrorLogger.logAuthError(error, { action: 'facebook_login' });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newUser = await authService.register(userData);
      
      // User state will be updated by the auth state listener
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'user_registration',
        additionalData: { email: userData.email, username: userData.username }
      });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.logout();
      
      // User state will be updated by the auth state listener
    } catch (error) {
      console.error('Logout error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'user_logout',
        userId: user?.uid
      });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      
      await authService.resetPassword(email);
      
      return { message: `Password reset email sent to ${email}` };
    } catch (error) {
      console.error('Password reset error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'password_reset',
        additionalData: { email }
      });
      setError(error.message);
      throw error;
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      setError(null);
      
      const updatedProfile = await profileService.updateProfile(user.uid, profileData);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...updatedProfile
      }));
      
      return updatedProfile;
    } catch (error) {
      console.error('Profile update error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'profile_update',
        userId: user?.uid
      });
      setError(error.message);
      throw error;
    }
  }, [user?.uid]);

  /**
   * Upload user avatar
   */
  const uploadAvatar = useCallback(async (file) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      setError(null);
      
      const avatarUrl = await profileService.uploadAvatar(user.uid, file);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        avatar: {
          url: avatarUrl,
          provider: 'upload'
        }
      }));
      
      return avatarUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'avatar_upload',
        userId: user?.uid
      });
      setError(error.message);
      throw error;
    }
  }, [user?.uid]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async () => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      await authService.refreshSession();
      
      // Extend session if remember me is enabled
      await sessionService.extendSession();
      
    } catch (error) {
      console.error('Session refresh error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'session_refresh',
        userId: user?.uid
      });
      
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [user?.uid, logout]);

  /**
   * Check if username is available
   */
  const checkUsernameAvailability = useCallback(async (username) => {
    try {
      // Don't pass excludeUid during signup (when user is null)
      return await profileService.isUsernameAvailable(username, user?.uid || null);
    } catch (error) {
      console.error('Username check error:', error);
      // Return true on error to allow form submission (will be caught during registration)
      return true;
    }
  }, [user?.uid]);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback(async (preferences) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      
      const updatedProfile = await profileService.updatePreferences(user.uid, preferences);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        preferences: updatedProfile.preferences
      }));
      
      return updatedProfile;
    } catch (error) {
      console.error('Preferences update error:', error);
      ErrorLogger.logAuthError(error, { 
        action: 'preferences_update',
        userId: user?.uid
      });
      setError(error.message);
      throw error;
    }
  }, [user?.uid]);

  // Context value
  const contextValue = {
    // User state
    user,
    loading,
    isAuthenticated,
    error,
    
    // Authentication methods
    login,
    loginWithGoogle,
    loginWithFacebook,
    register,
    logout,
    resetPassword,
    
    // Profile methods
    updateProfile,
    uploadAvatar,
    checkUsernameAvailability,
    updatePreferences,
    
    // Session methods
    refreshSession,
    
    // Utility methods
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook to require authentication
 */
export const useRequireAuth = () => {
  const { user, loading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }, [loading, isAuthenticated]);
  
  return { user, loading, isAuthenticated };
};

export default AuthContext;
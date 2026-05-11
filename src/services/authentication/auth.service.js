import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../config/firebase.js';
import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { sessionService } from '../profile/session.service.js';

/**
 * Authentication service for handling Firebase Auth operations
 * and backend API authentication synchronization
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });
  }

  /**
   * Register auth state change listener
   * @param {Function} callback - Callback function to execute on auth state change
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Notify all auth state listeners
   * @param {Object|null} user - Current user object or null
   */
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => callback(user));
  }

  /**
   * Authenticate with backend API using Firebase ID token
   * @param {string} idToken - Firebase ID token
   * @returns {Promise<Object>} Backend user data
   */
  async authenticateWithBackend(idToken) {
    try {
      // Set token in API client
      apiClient.setAuthToken(idToken);
      
      // Send token to backend /auth endpoint
      const response = await apiClient.post('/auth', { token: idToken });
      
      return response;
    } catch (error) {
      console.error('Backend authentication failed:', error);
      throw new Error(error.message || 'Failed to authenticate with backend. Please try again.');
    }
  }

  /**
   * Get Firebase ID token
   * @param {boolean} forceRefresh - Force token refresh
   * @returns {Promise<string>} Firebase ID token
   */
  async getIdToken(forceRefresh = false) {
    try {
      return await tokenManager.getToken(forceRefresh);
    } catch (error) {
      console.error('Failed to get ID token:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise<Object>} User object
   */
  async loginWithEmail(email, password, rememberMe = false) {
    try {
      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Authenticate with backend
      const backendUser = await this.authenticateWithBackend(idToken);
      
      // Store session data
      sessionService.setSession({
        uid: user.uid,
        email: user.email,
        username: backendUser.username,
        display_name: backendUser.display_name,
        tokenExpiration: tokenManager.getTokenExpiration(),
        rememberMe
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        username: backendUser.username,
        display_name: backendUser.display_name
      };
    } catch (error) {
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Sign in with Google OAuth
   * @returns {Promise<Object>} User object
   */
  async loginWithGoogle() {
    try {
      // Authenticate with Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Authenticate with backend (backend creates/updates profile)
      const backendUser = await this.authenticateWithBackend(idToken);
      
      // Store session data
      sessionService.setSession({
        uid: user.uid,
        email: user.email,
        username: backendUser.username,
        display_name: backendUser.display_name,
        tokenExpiration: tokenManager.getTokenExpiration(),
        rememberMe: false
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        username: backendUser.username,
        display_name: backendUser.display_name
      };
    } catch (error) {
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Sign in with Facebook OAuth
   * @returns {Promise<Object>} User object
   */
  async loginWithFacebook() {
    try {
      // Authenticate with Firebase
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Authenticate with backend (backend creates/updates profile)
      const backendUser = await this.authenticateWithBackend(idToken);
      
      // Store session data
      sessionService.setSession({
        uid: user.uid,
        email: user.email,
        username: backendUser.username,
        display_name: backendUser.display_name,
        tokenExpiration: tokenManager.getTokenExpiration(),
        rememberMe: false
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        username: backendUser.username,
        display_name: backendUser.display_name
      };
    } catch (error) {
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Register new user with email and password
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User object
   */
  async register(userData) {
    try {
      const { email, password, username, ...profileData } = userData;
      
      // Create user account in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile with username as displayName
      await updateProfile(user, {
        displayName: username
      });
      
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      // Authenticate with backend (backend creates profile)
      const backendUser = await this.authenticateWithBackend(idToken);
      
      // Store session data
      sessionService.setSession({
        uid: user.uid,
        email: user.email,
        username: backendUser.username,
        display_name: backendUser.display_name,
        tokenExpiration: tokenManager.getTokenExpiration(),
        rememberMe: false
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        username: backendUser.username,
        display_name: backendUser.display_name
      };
    } catch (error) {
      console.error('Registration error details:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      // Clear session data
      sessionService.clearSession();
      
      // Clear token manager
      tokenManager.clearToken();
      
      // Clear API client token
      apiClient.clearAuthToken();
      
      // Sign out from Firebase
      await signOut(auth);
      
      this.currentUser = null;
    } catch (error) {
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Refresh current session
   * @returns {Promise<void>}
   */
  async refreshSession() {
    try {
      if (this.currentUser) {
        // Get fresh token
        const token = await this.getIdToken(true);
        
        // Update API client token
        apiClient.setAuthToken(token);
        
        // Update session with new token expiration
        const session = sessionService.getSession();
        if (session) {
          sessionService.setSession({
            ...session,
            tokenExpiration: tokenManager.getTokenExpiration()
          });
        }
      }
    } catch (error) {
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Get current user
   * @returns {Object|null} Current user object or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Translate Firebase errors to user-friendly messages
   * @param {Error} error - Firebase error
   * @returns {Error} Translated error
   */
  translateFirebaseError(error) {
    console.error('Firebase error:', error.code, error.message);
    
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/username-already-exists': 'Username is already taken. Please choose a different username.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials.',
      'auth/invalid-credential': 'The provided credentials are invalid.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/invalid-verification-code': 'Invalid verification code.',
      'auth/invalid-verification-id': 'Invalid verification ID.',
      'permission-denied': 'Firebase permission denied. Please check your Firebase configuration.',
      'unavailable': 'Firebase service is unavailable. Please check your Firebase configuration.'
    };
    
    let message = errorMessages[error.code] || error.message || 'An unexpected error occurred. Please try again.';
    
    // Check if it's a Firebase configuration issue
    if (error.message && error.message.includes('Firebase')) {
      message = 'Firebase is not properly configured. Please check your environment variables and Firebase project settings.';
    }
    
    const translatedError = new Error(message);
    translatedError.code = error.code;
    translatedError.originalError = error;
    
    return translatedError;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase.js';
import { profileService } from './profile.service.js';
import { sessionService } from './session.service.js';

/**
 * Authentication service for handling Firebase Auth operations
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
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise<Object>} User object
   */
  async loginWithEmail(email, password, rememberMe = false) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userProfile = await profileService.getProfile(user.uid);
      
      // Set session with remember me preference
      await sessionService.setSession(user, rememberMe);
      
      // Update last login timestamp
      await profileService.updateProfile(user.uid, {
        lastLoginAt: new Date()
      });
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...userProfile
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
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Extract profile information from Google
      const profileData = {
        fullName: user.displayName,
        email: user.email,
        avatar: {
          url: user.photoURL,
          provider: 'google'
        },
        authProviders: ['google.com']
      };
      
      // Create or update profile
      const userProfile = await profileService.createOrUpdateProfile(user.uid, profileData);
      
      // Set session
      await sessionService.setSession(user, false);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...userProfile
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
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      
      // Extract profile information from Facebook
      const profileData = {
        fullName: user.displayName,
        email: user.email,
        avatar: {
          url: user.photoURL,
          provider: 'facebook'
        },
        authProviders: ['facebook.com']
      };
      
      // Create or update profile
      const userProfile = await profileService.createOrUpdateProfile(user.uid, profileData);
      
      // Set session
      await sessionService.setSession(user, false);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...userProfile
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
      const { email, password, ...profileData } = userData;
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.fullName
      });
      
      // Create user profile in Firestore
      const userProfile = await profileService.createProfile(user.uid, {
        ...profileData,
        email: user.email,
        authProviders: ['password']
      });
      
      // Set session
      await sessionService.setSession(user, false);
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...userProfile
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
      await sessionService.clearSession();
      
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
        const token = await this.currentUser.getIdToken(true);
        
        // Update session
        await sessionService.refreshToken(token);
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
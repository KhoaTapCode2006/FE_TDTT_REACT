import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

/**
 * Firebase Configuration
 * Single Firebase instance for authentication only
 * 
 * NOTE: Firestore and Storage are temporarily included for backward compatibility
 * with existing services (savedLists, stays, booking, collection, favorites).
 * These should be migrated to use the backend API in the future.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

/**
 * Validate Firebase configuration
 * @returns {boolean} True if configuration is valid
 */
const isFirebaseConfigured = 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.authDomain;

// Log configuration status
if (!isFirebaseConfigured) {
  console.error(
    '%c⚠️ Firebase Not Configured',
    'color: red; font-size: 16px; font-weight: bold;',
    '\n\nFirebase is not properly configured.\n' +
    'Please check your .env file for the following required variables:\n' +
    '- VITE_FIREBASE_API_KEY\n' +
    '- VITE_FIREBASE_PROJECT_ID\n' +
    '- VITE_FIREBASE_AUTH_DOMAIN\n' +
    '\nAuthentication features will not work until Firebase is configured.'
  );
} else {
  console.log(
    '%c✅ Firebase Configured',
    'color: green; font-size: 14px; font-weight: bold;',
    `\nProject: ${firebaseConfig.projectId}`
  );
}

// ============================================
// Initialize Firebase App
// ============================================

// Initialize single Firebase app for authentication
const app = initializeApp(firebaseConfig);

// ============================================
// Initialize Firebase Authentication
// ============================================

export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// ============================================
// Initialize Firestore (Temporary - for backward compatibility)
// ============================================

// TODO: Remove this once savedLists, stays, booking, collection, and favorites
// services are migrated to use the backend API
let db = null;
try {
  db = getFirestore(app);
  console.warn(
    '%c⚠️ Firestore Temporary Export',
    'color: orange; font-size: 12px;',
    '\nFirestore is temporarily enabled for backward compatibility.\n' +
    'Services using Firestore should be migrated to the backend API.'
  );
} catch (error) {
  console.warn('Firestore not available:', error.message);
}
export { db };

// ============================================
// Initialize Storage (Temporary - for backward compatibility)
// ============================================

// TODO: Remove this once avatar uploads are migrated to cloud storage
let storage = null;
try {
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase Storage not available:', error.message);
}
export { storage };

// ============================================
// Configure OAuth Providers
// ============================================

export const googleProvider = new GoogleAuthProvider();

// Configure Google provider settings
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// ============================================
// Exports
// ============================================

// Export Firebase app
export { app };

// Export configuration status
export { isFirebaseConfigured };

// Default export is the Firebase app
export default app;

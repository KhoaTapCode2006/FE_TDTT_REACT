import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && 
                              firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (!isFirebaseConfigured) {
  console.warn(
    '%c⚠️ Firebase Not Configured',
    'color: orange; font-size: 16px; font-weight: bold;',
    '\n\nTo enable authentication, please:\n' +
    '1. Create a Firebase project at https://console.firebase.google.com\n' +
    '2. Enable Authentication (Email/Password, Google, Facebook)\n' +
    '3. Enable Firestore Database\n' +
    '4. Copy your Firebase config to a .env file\n' +
    '5. Restart the development server\n'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Storage is optional - only initialize if needed
let storage = null;
try {
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase Storage not available. Avatar uploads will be disabled.');
}
export { storage };

// Configure auth providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Configure provider settings
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

facebookProvider.setCustomParameters({
  display: 'popup'
});

// Request additional permissions for Facebook
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export { isFirebaseConfigured };
export default app;
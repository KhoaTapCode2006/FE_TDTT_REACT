/**
 * Firebase Debug Utilities
 * Helps diagnose Firebase connection and permission issues
 */

import { db, auth } from '../config/firebase.js';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

/**
 * Test Firestore connection and permissions
 */
export async function testFirestoreConnection() {
  const results = {
    initialized: false,
    canRead: false,
    canWrite: false,
    error: null,
    details: {}
  };

  try {
    // Check if Firestore is initialized
    if (!db) {
      results.error = 'Firestore is not initialized';
      return results;
    }
    results.initialized = true;
    results.details.projectId = db.app.options.projectId;

    // Test read permission
    try {
      const testCollection = collection(db, 'users');
      const q = query(testCollection, limit(1));
      await getDocs(q);
      results.canRead = true;
    } catch (error) {
      results.details.readError = error.code || error.message;
      console.warn('Firestore read test failed:', error);
    }

    // Test write permission (only if authenticated)
    if (auth.currentUser) {
      try {
        const testCollection = collection(db, 'test_connection');
        const testDoc = {
          test: true,
          timestamp: new Date(),
          userId: auth.currentUser.uid
        };
        await addDoc(testCollection, testDoc);
        results.canWrite = true;
      } catch (error) {
        results.details.writeError = error.code || error.message;
        console.warn('Firestore write test failed:', error);
      }
    } else {
      results.details.writeError = 'User not authenticated';
    }

  } catch (error) {
    results.error = error.message;
    results.details.generalError = error.code || error.message;
  }

  return results;
}

/**
 * Test Authentication
 */
export async function testAuthentication() {
  const results = {
    initialized: false,
    currentUser: null,
    error: null
  };

  try {
    if (!auth) {
      results.error = 'Authentication is not initialized';
      return results;
    }
    results.initialized = true;

    if (auth.currentUser) {
      results.currentUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName
      };
    }
  } catch (error) {
    results.error = error.message;
  }

  return results;
}

/**
 * Run all Firebase tests
 */
export async function runFirebaseTests() {
  console.group('🔥 Firebase Connection Tests');
  
  const authTest = await testAuthentication();
  console.log('Authentication:', authTest);
  
  const firestoreTest = await testFirestoreConnection();
  console.log('Firestore:', firestoreTest);
  
  console.groupEnd();
  
  return {
    auth: authTest,
    firestore: firestoreTest
  };
}

/**
 * Get Firebase status summary
 */
export function getFirebaseStatus() {
  return {
    auth: {
      initialized: !!auth,
      hasUser: !!auth?.currentUser,
      userId: auth?.currentUser?.uid || null
    },
    firestore: {
      initialized: !!db,
      projectId: db?.app?.options?.projectId || null
    }
  };
}

/**
 * Log detailed error information
 */
export function logFirebaseError(error, context = {}) {
  console.group('🔥 Firebase Error Details');
  console.error('Error:', error);
  console.log('Error Code:', error.code);
  console.log('Error Message:', error.message);
  console.log('Context:', context);
  console.log('Firebase Status:', getFirebaseStatus());
  console.groupEnd();
}

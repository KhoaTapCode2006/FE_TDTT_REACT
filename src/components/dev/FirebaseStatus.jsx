import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../../config/firebase.js';
import { db, auth, storage } from '../../config/firebase.js';
import { runFirebaseTests } from '../../utils/firebaseDebug.js';
import Icon from '../ui/Icon.jsx';

/**
 * Firebase Status Component (Development Only)
 * Shows Firebase configuration status and helps with debugging
 */
const FirebaseStatus = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState({
    configured: false,
    auth: false,
    firestore: false,
    storage: false
  });
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.PROD) return;

    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = async () => {
    const newStatus = {
      configured: isFirebaseConfigured,
      auth: !!auth,
      firestore: !!db,
      storage: !!storage
    };

    // Test Firestore connection
    if (db) {
      try {
        // Try to access Firestore (this will fail if not enabled)
        await db.app.options;
        newStatus.firestore = true;
      } catch (error) {
        console.error('Firestore check failed:', error);
        newStatus.firestore = false;
      }
    }

    setStatus(newStatus);
  };

  const runTests = async () => {
    setTesting(true);
    try {
      const results = await runFirebaseTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  // Don't render in production
  if (import.meta.env.PROD) return null;

  return (
    <>
      {/* Floating Status Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-full p-3 shadow-lg hover:bg-gray-800 transition-colors"
        title="Firebase Status"
      >
        <Icon name="settings" size={20} />
      </button>

      {/* Status Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-96 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Icon name="cloud" size={20} />
              Firebase Status
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Configuration Status */}
            <StatusItem
              label="Configuration"
              status={status.configured}
              description="Environment variables loaded"
            />

            {/* Auth Status */}
            <StatusItem
              label="Authentication"
              status={status.auth}
              description="Firebase Auth initialized"
            />

            {/* Firestore Status */}
            <StatusItem
              label="Firestore"
              status={status.firestore}
              description="Database connection"
            />

            {/* Storage Status */}
            <StatusItem
              label="Storage"
              status={status.storage}
              description="File upload service (optional)"
            />
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Test Results:</h4>
              <div className="text-xs space-y-2">
                {testResults.auth && (
                  <div>
                    <div className="font-semibold">Auth:</div>
                    <div className="text-gray-600">
                      {testResults.auth.currentUser ? (
                        <>✅ Logged in as {testResults.auth.currentUser.email}</>
                      ) : (
                        <>⚠️ Not logged in</>
                      )}
                    </div>
                  </div>
                )}
                {testResults.firestore && (
                  <div>
                    <div className="font-semibold">Firestore:</div>
                    <div className="text-gray-600">
                      {testResults.firestore.initialized ? '✅ Initialized' : '❌ Not initialized'}
                    </div>
                    <div className="text-gray-600">
                      {testResults.firestore.canRead ? '✅ Can read' : '❌ Cannot read'}
                    </div>
                    <div className="text-gray-600">
                      {testResults.firestore.canWrite ? '✅ Can write' : '❌ Cannot write'}
                    </div>
                    {testResults.firestore.error && (
                      <div className="text-red-600 mt-1">
                        Error: {testResults.firestore.error}
                      </div>
                    )}
                    {testResults.firestore.details && (
                      <div className="text-gray-500 mt-1 text-xs">
                        {JSON.stringify(testResults.firestore.details, null, 2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Help Links */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Need help?</p>
            <div className="flex flex-col gap-1">
              <a
                href="/FIREBASE_SETUP.md"
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Icon name="description" size={14} />
                Setup Guide
              </a>
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Icon name="open_in_new" size={14} />
                Firebase Console
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 space-y-2">
            <button
              onClick={runTests}
              disabled={testing}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Icon name={testing ? "hourglass_empty" : "science"} size={16} />
              {testing ? 'Testing...' : 'Run Connection Tests'}
            </button>
            
            <button
              onClick={checkFirebaseStatus}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="refresh" size={16} />
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Status Item Component
 */
const StatusItem = ({ label, status, description }) => {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${status ? 'text-green-500' : 'text-red-500'}`}>
        <Icon name={status ? 'check_circle' : 'cancel'} size={20} />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </div>
  );
};

export default FirebaseStatus;

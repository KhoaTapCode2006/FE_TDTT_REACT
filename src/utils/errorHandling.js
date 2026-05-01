/**
 * Error handling utilities for authentication system
 */

/**
 * Firebase error translation utility
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export const translateFirebaseError = (error) => {
  const errorMessages = {
    // Authentication errors
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
    'auth/expired-action-code': 'The action code has expired.',
    'auth/invalid-action-code': 'The action code is invalid.',
    'auth/missing-email': 'Email address is required.',
    'auth/missing-password': 'Password is required.',
    'auth/invalid-phone-number': 'Invalid phone number format.',
    'auth/missing-phone-number': 'Phone number is required.',
    'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
    
    // Firestore errors
    'firestore/permission-denied': 'You do not have permission to access this data.',
    'firestore/unavailable': 'Service is temporarily unavailable. Please try again.',
    'firestore/deadline-exceeded': 'Request timed out. Please try again.',
    'firestore/resource-exhausted': 'Service quota exceeded. Please try again later.',
    'firestore/unauthenticated': 'You must be signed in to access this data.',
    'firestore/not-found': 'The requested data was not found.',
    'firestore/already-exists': 'The data already exists.',
    'firestore/failed-precondition': 'Operation failed due to a precondition.',
    'firestore/aborted': 'Operation was aborted. Please try again.',
    'firestore/out-of-range': 'Invalid data range provided.',
    'firestore/data-loss': 'Data loss detected. Please contact support.',
    
    // Storage errors
    'storage/object-not-found': 'File not found.',
    'storage/bucket-not-found': 'Storage bucket not found.',
    'storage/project-not-found': 'Project not found.',
    'storage/quota-exceeded': 'Storage quota exceeded.',
    'storage/unauthenticated': 'You must be signed in to upload files.',
    'storage/unauthorized': 'You do not have permission to upload files.',
    'storage/retry-limit-exceeded': 'Upload failed after multiple attempts.',
    'storage/invalid-checksum': 'File upload failed due to checksum mismatch.',
    'storage/canceled': 'Upload was cancelled.',
    'storage/invalid-event-name': 'Invalid event name.',
    'storage/invalid-url': 'Invalid file URL.',
    'storage/invalid-argument': 'Invalid argument provided.',
    'storage/no-default-bucket': 'No default storage bucket configured.',
    'storage/cannot-slice-blob': 'File processing failed.',
    'storage/server-file-wrong-size': 'File size mismatch on server.'
  };
  
  return errorMessages[error.code] || error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Form validation utilities
 */
export const validators = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {string|null} Error message or null if valid
   */
  email: (email) => {
    if (!email) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    return null;
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with error and strength info
   */
  password: (password) => {
    if (!password) return { error: 'Password is required.', strength: 0 };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Calculate strength
    Object.values(checks).forEach(check => {
      if (check) strength++;
    });
    
    // Determine error message
    let error = null;
    if (password.length < 6) {
      error = 'Password must be at least 6 characters long.';
    } else if (password.length < 8) {
      error = 'Password should be at least 8 characters for better security.';
    }
    
    return {
      error,
      strength: Math.min(strength, 5),
      checks,
      strengthText: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][Math.min(strength, 4)]
    };
  },

  /**
   * Validate username
   * @param {string} username - Username to validate
   * @returns {string|null} Error message or null if valid
   */
  username: (username) => {
    if (!username) return 'Username is required.';
    
    // Trim leading and trailing spaces
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 3) return 'Username must be at least 3 characters long.';
    if (trimmedUsername.length > 30) return 'Username must be less than 30 characters.';
    
    // Check for valid characters: letters, numbers, underscores, and single spaces
    if (!/^[a-zA-Z0-9_ ]+$/.test(trimmedUsername)) {
      return 'Username can only contain letters, numbers, underscores, and spaces.';
    }
    
    // Check for multiple consecutive spaces
    if (/\s{2,}/.test(trimmedUsername)) {
      return 'Username cannot contain multiple consecutive spaces.';
    }
    
    // Check if username starts or ends with space (after trim, this shouldn't happen, but double-check)
    if (trimmedUsername !== username) {
      return 'Username cannot start or end with spaces.';
    }
    
    return null;
  },

  /**
   * Validate full name
   * @param {string} fullName - Full name to validate
   * @returns {string|null} Error message or null if valid
   */
  fullName: (fullName) => {
    if (!fullName) return 'Full name is required.';
    if (fullName.trim().length < 2) return 'Full name must be at least 2 characters long.';
    if (fullName.trim().length > 50) return 'Full name must be less than 50 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim())) return 'Full name can only contain letters, spaces, hyphens, and apostrophes.';
    return null;
  },

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {string|null} Error message or null if valid
   */
  phone: (phone) => {
    if (!phone) return null; // Phone is optional
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number.';
    return null;
  },

  /**
   * Validate date of birth
   * @param {Date|string} dob - Date of birth to validate
   * @returns {string|null} Error message or null if valid
   */
  dateOfBirth: (dob) => {
    if (!dob) return null; // DOB is optional
    
    const date = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    
    if (isNaN(date.getTime())) return 'Please enter a valid date.';
    if (date > now) return 'Date of birth cannot be in the future.';
    if (age > 120) return 'Please enter a valid date of birth.';
    if (age < 13) return 'You must be at least 13 years old to create an account.';
    
    return null;
  },

  /**
   * Validate zip code
   * @param {string} zipCode - Zip code to validate
   * @returns {string|null} Error message or null if valid
   */
  zipCode: (zipCode) => {
    if (!zipCode) return null; // Zip code is optional
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) return 'Please enter a valid zip code (e.g., 12345 or 12345-6789).';
    return null;
  }
};

/**
 * Network error detection and handling
 */
export const networkErrorHandler = {
  /**
   * Check if user is online
   * @returns {boolean} Online status
   */
  isOnline: () => navigator.onLine,

  /**
   * Handle network errors
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  handleNetworkError: (error) => {
    if (!navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection.';
    }
    
    if (error.code === 'auth/network-request-failed' || error.message?.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.code === 'unavailable' || error.message?.includes('unavailable')) {
      return 'Service is temporarily unavailable. Please try again in a moment.';
    }
    
    return 'A network error occurred. Please try again.';
  },

  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} Promise that resolves with function result
   */
  retryWithBackoff: async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.code?.includes('permission-denied') || 
            error.code?.includes('unauthenticated') ||
            error.code?.includes('invalid-argument')) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
};

/**
 * Error logging service
 */
export class ErrorLogger {
  /**
   * Log authentication error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  static logAuthError(error, context = {}) {
    const errorData = {
      timestamp: new Date().toISOString(),
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown error',
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || 'anonymous',
      action: context.action || 'unknown',
      additionalData: context.additionalData || {}
    };
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🔥 Authentication Error');
      console.error('Error:', error);
      console.table(errorData);
      console.groupEnd();
    }
    
    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoringService(errorData);
    }
  }

  /**
   * Send error data to monitoring service
   * @param {Object} errorData - Error data to send
   */
  static sendToMonitoringService(errorData) {
    // This would integrate with services like Sentry, LogRocket, or custom logging
    // For now, we'll just store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('b4lu_errors') || '[]');
      errors.push(errorData);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('b4lu_errors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  /**
   * Get stored errors for debugging
   * @returns {Array} Array of stored errors
   */
  static getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('b4lu_errors') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear stored errors
   */
  static clearStoredErrors() {
    localStorage.removeItem('b4lu_errors');
  }
}

/**
 * Form validation helper
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result with errors
 */
export const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });
  
  return { isValid, errors };
};

/**
 * Debounce function for real-time validation
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
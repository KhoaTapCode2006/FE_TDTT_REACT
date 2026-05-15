import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} UserItem
 * @property {string} uid - Unique user identifier (Firebase UID)
 * @property {string} username - Username (unique, 3-20 characters)
 * @property {string} display_name - Display name (user's full name)
 * @property {string|null} avatar_url - Avatar image URL or null
 */

/**
 * @typedef {'NETWORK_ERROR'|'TIMEOUT_ERROR'|'SERVER_ERROR'|'AUTH_ERROR'|'VALIDATION_ERROR'} ErrorCode
 */

/**
 * @typedef {Object} ErrorObject
 * @property {ErrorCode} code - Error code
 * @property {string} message - Error message
 * @property {number} [statusCode] - HTTP status code
 * @property {Error} [originalError] - Original error object
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Create configured axios instance for user API
 * NOTE: Backend does NOT use /api/v1 prefix
 */
const userClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
userClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      const error = new Error('User not authenticated');
      error.code = 'AUTH_ERROR';
      throw error;
    }
    
    try {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw error;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle response errors and extract data
 */
userClient.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response;
  },
  (error) => {
    // Transform error to standard format
    const transformedError = transformError(error);
    return Promise.reject(transformedError);
  }
);

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Transform axios errors to application errors
 * @param {Error} error - Axios error object
 * @returns {Error} Transformed error with code and message
 */
function transformError(error) {
  const appError = new Error();
  
  if (error.code === 'ECONNABORTED') {
    appError.code = 'TIMEOUT_ERROR';
    appError.message = 'Request timeout - please try again';
  } else if (error.response) {
    // Server responded with error status
    appError.code = 'SERVER_ERROR';
    appError.statusCode = error.response.status;
    appError.message = error.response.data?.message || error.message;
    
    // Map specific HTTP status codes
    if (error.response.status === 404) {
      appError.message = 'User not found';
    } else if (error.response.status === 500) {
      appError.message = 'Server error - please try again later';
    } else if (error.response.status === 403) {
      appError.message = error.response.data?.message || 'Permission denied';
    }
  } else if (error.request) {
    // Network error
    appError.code = 'NETWORK_ERROR';
    appError.message = 'Network error - please check your connection';
  } else if (error.code === 'AUTH_ERROR') {
    appError.code = 'AUTH_ERROR';
    appError.message = error.message || 'User not authenticated';
  } else {
    appError.code = 'UNKNOWN_ERROR';
    appError.message = error.message || 'An unexpected error occurred';
  }
  
  appError.originalError = error;
  console.error('User service error:', appError);
  
  return appError;
}

/**
 * Validate search query
 * @param {string} searchQuery - Search query to validate
 * @throws {Error} Validation error with code VALIDATION_ERROR
 */
function validateSearchQuery(searchQuery) {
  if (typeof searchQuery !== 'string') {
    const error = new Error('Search query must be a string');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  const trimmedQuery = searchQuery.trim();
  
  if (trimmedQuery.length < 2) {
    const error = new Error('Search query must be at least 2 characters');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  if (trimmedQuery.length > 100) {
    const error = new Error('Search query must be maximum 100 characters');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

// ============================================================================
// RESPONSE DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Extract user list from API response
 * @param {Object} response - Axios response object
 * @returns {UserItem[]} Array of user items
 */
function extractUserList(response) {
  const data = response.data?.data;
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid response format from server');
  }
  
  return data.map(user => ({
    uid: user.uid,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url || null,
  }));
}

// ============================================================================
// SERVICE INTERFACE - PUBLIC API METHODS
// ============================================================================

/**
 * User Service - Manages user search operations via HTTP API
 * 
 * IMPORTANT: All endpoints do NOT have trailing slashes
 * Backend is strict about URL format
 */
export const userService = {
  /**
   * Search users by username or display name
   * Endpoint: GET /users?search=<query>
   * 
   * @param {string} searchQuery - Search query (minimum 2 characters)
   * @param {Object} [options={}] - Request options
   * @param {AbortSignal} [options.signal] - Abort signal for cancellation
   * @returns {Promise<UserItem[]>} Array of matching users
   * @throws {Error} Validation or network error
   * 
   * @example
   * // Basic search
   * const users = await userService.searchUsers('john');
   * 
   * @example
   * // Search with cancellation support
   * const controller = new AbortController();
   * const users = await userService.searchUsers('john', { signal: controller.signal });
   * // Later: controller.abort();
   */
  async searchUsers(searchQuery, options = {}) {
    // Validate search query
    validateSearchQuery(searchQuery);
    
    const trimmedQuery = searchQuery.trim();
    
    // Build request config
    const config = {
      params: {
        search: trimmedQuery,
      },
    };
    
    // Add abort signal if provided
    if (options.signal) {
      config.signal = options.signal;
    }
    
    // Make API request
    const response = await userClient.get('/users', config);
    
    // Extract and return user list
    return extractUserList(response);
  },
};

export default userService;

import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} SuggestionItem
 * @property {string} address - Full address text
 * @property {string} name - Place name
 * @property {string} display - Display text (formatted for UI)
 * @property {number} distance - Distance from user location (meters)
 * @property {string} ref_id - Unique identifier (used as place_id)
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Create configured axios instance for address suggest API
 */
const addressSuggestClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
addressSuggestClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    
    // Allow unauthenticated requests (component still functions)
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to get auth token, continuing without auth:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle response errors and extract data
 */
addressSuggestClient.interceptors.response.use(
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
      appError.code = 'SERVER_ERROR';
      appError.message = 'No results found';
    } else if (error.response.status === 500) {
      appError.code = 'SERVER_ERROR';
      appError.message = 'Server error - please try again later';
    }
  } else if (error.request) {
    // Network error
    appError.code = 'NETWORK_ERROR';
    appError.message = 'Network error - please check your connection';
  } else {
    appError.code = 'UNKNOWN_ERROR';
    appError.message = error.message || 'An unexpected error occurred';
  }
  
  appError.originalError = error;
  console.error('Address suggest service error:', appError);
  
  return appError;
}

/**
 * Validate response format from address suggest API
 * @param {Object} response - Axios response object
 * @throws {Error} Validation error with code VALIDATION_ERROR
 */
function validateResponse(response) {
  const data = response.data?.data?.suggestions;
  
  if (!Array.isArray(data)) {
    const error = new Error('Invalid response format from server');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  // Validate each suggestion item has required fields
  for (const item of data) {
    if (!item || typeof item !== 'object') {
      const error = new Error('Invalid suggestion item format');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    
    // ref_id is required for place identification
    if (!item.ref_id) {
      console.warn('Suggestion item missing ref_id:', item);
    }
  }
}

/**
 * Normalize suggestion items from API response
 * @param {Object} response - Axios response object
 * @returns {SuggestionItem[]} Array of normalized suggestion items
 */
function normalizeSuggestions(response) {
  validateResponse(response);
  
  const data = response.data?.data?.suggestions || [];
  
  return data.map(item => ({
    address: item.address || '',
    name: item.name || '',
    display: item.display || item.name || item.address || '',
    distance: typeof item.distance === 'number' ? item.distance : 0,
    ref_id: item.ref_id || '',
  }));
}

// ============================================================================
// SERVICE INTERFACE - PUBLIC API METHODS
// ============================================================================

/**
 * Address Suggest Service - Provides location search suggestions
 * 
 * Endpoint: GET /discover/address-suggest?text={searchTerm}
 */
export const addressSuggestService = {
  /**
   * Search for place suggestions based on search term
   * 
   * @param {string} searchTerm - Search query (minimum 2 characters)
   * @param {Object} [options] - Optional configuration
   * @param {AbortSignal} [options.signal] - AbortController signal for request cancellation
   * @param {Object} [options.gps] - GPS coordinates {latitude, longitude}
   * @returns {Promise<SuggestionItem[]>} Array of place suggestions
   * @throws {Error} Network, timeout, or validation error
   */
  async searchPlaces(searchTerm, options = {}) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      return [];
    }
    
    // Trim and validate minimum length
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < 2) {
      return [];
    }

    try {
      // Build request body
      const requestBody = {
        query: trimmedTerm,
      };
      
      // Add GPS coordinates if provided
      if (options.gps && options.gps.latitude && options.gps.longitude) {
        requestBody.gps = {
          latitude: options.gps.latitude,
          longitude: options.gps.longitude,
        };
      }
      
      const response = await addressSuggestClient.post('/discover/address-suggest', requestBody, {
        signal: options.signal,
      });
      
      return normalizeSuggestions(response);
    } catch (error) {
      // If request was cancelled, return empty array instead of throwing
      if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
        return [];
      }
      
      throw error;
    }
  },
};

export default addressSuggestService;

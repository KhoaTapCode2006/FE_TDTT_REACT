import { auth } from '../../config/firebase.js';
import { requestDeduplicator } from '../../utils/requestDeduplicator.js';

/**
 * API Client for making authenticated requests to the backend API
 * Handles automatic token injection, token refresh, error translation, and retry logic
 */
class APIClient {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.timeout = 30000; // 30 seconds
    this.authToken = null;
    this.maxRetries = 3; // Maximum retry attempts for 5xx errors
    this.retryDelay = 1000; // Initial retry delay in ms (exponential backoff)
  }

  /**
   * Log request/response for debugging (development mode only)
   * @param {string} type - Log type ('request' or 'response' or 'error')
   * @param {Object} data - Data to log
   */
  logDebug(type, data) {
    if (import.meta.env.DEV) {
      const timestamp = new Date().toISOString();
      
      if (type === 'request') {
        console.group(`🔵 API Request [${timestamp}]`);
        console.log('Method:', data.method);
        console.log('URL:', data.url);
        console.log('Headers:', data.headers);
        if (data.body) {
          console.log('Body:', data.body);
        }
        console.groupEnd();
      } else if (type === 'response') {
        console.group(`🟢 API Response [${timestamp}]`);
        console.log('Status:', data.status);
        console.log('URL:', data.url);
        console.log('Data:', data.data);
        console.groupEnd();
      } else if (type === 'error') {
        console.group(`🔴 API Error [${timestamp}]`);
        console.log('Status:', data.status);
        console.log('URL:', data.url);
        console.log('Message:', data.message);
        console.log('Error:', data.error);
        console.groupEnd();
      } else if (type === 'retry') {
        console.group(`🟡 API Retry [${timestamp}]`);
        console.log('Attempt:', data.attempt);
        console.log('URL:', data.url);
        console.log('Delay:', data.delay, 'ms');
        console.groupEnd();
      }
    }
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Retry attempt number (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  calculateBackoffDelay(attempt) {
    // Exponential backoff: delay * (2 ^ attempt)
    // Attempt 0: 1000ms, Attempt 1: 2000ms, Attempt 2: 4000ms
    return this.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Duration in milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable (5xx server errors)
   * @param {Object} error - Error object
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    // Retry on 5xx server errors
    return error.status >= 500 && error.status < 600;
  }

  /**
   * Get base URL from environment variable
   * @returns {string} Base URL
   * @throws {Error} If VITE_LOCAL_API is not configured
   */
  getBaseURL() {
    const baseURL = import.meta.env.VITE_LOCAL_API;
    
    if (!baseURL) {
      throw new Error('Backend API URL is not configured. Please set VITE_LOCAL_API in your .env file.');
    }
    
    // Remove trailing slash
    return baseURL.replace(/\/$/, '');
  }

  /**
   * Set authentication token
   * @param {string} token - Firebase ID token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Refresh authentication token from Firebase
   * @returns {Promise<string>} New token
   */
  async refreshAuthToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      const token = await user.getIdToken(true);
      this.setAuthToken(token);
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  /**
   * Add authentication header to request config
   * @param {Object} config - Request configuration
   * @returns {Object} Updated configuration
   */
  addAuthHeader(config = {}) {
    const headers = config.headers || {};
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
  }

  /**
   * Make HTTP request with timeout, retry logic, error handling, and deduplication
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @param {number} retryAttempt - Current retry attempt (internal use)
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}, retryAttempt = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const config = this.addAuthHeader(options);
    
    // Generate deduplication key
    const method = config.method || 'GET';
    const body = config.body ? JSON.parse(config.body) : null;
    const dedupKey = requestDeduplicator.generateKey(method, endpoint, body);
    
    // Execute request with deduplication
    return requestDeduplicator.deduplicate(dedupKey, async () => {
      // Log request in development mode
      this.logDebug('request', {
        method: method,
        url: url,
        headers: config.headers,
        body: config.body
      });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const result = await this.handleResponse(response, endpoint, options);
        
        // Log successful response in development mode
        this.logDebug('response', {
          status: response.status,
          url: url,
          data: result
        });
        
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Check if error is retryable and we haven't exceeded max retries
        if (this.isRetryableError(error) && retryAttempt < this.maxRetries) {
          const delay = this.calculateBackoffDelay(retryAttempt);
          
          // Log retry attempt in development mode
          this.logDebug('retry', {
            attempt: retryAttempt + 1,
            url: url,
            delay: delay
          });
          
          // Wait before retrying
          await this.sleep(delay);
          
          // Retry the request
          return await this.request(endpoint, options, retryAttempt + 1);
        }
        
        // Log error in development mode
        this.logDebug('error', {
          status: error.status,
          url: url,
          message: error.message,
          error: error
        });
        
        return await this.handleError(error, endpoint, options);
      }
    });
  }

  /**
   * Handle successful response
   * @param {Response} response - Fetch response
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Original request options
   * @returns {Promise<any>} Response data
   */
  async handleResponse(response, endpoint, options) {
    // Handle 401 Unauthorized - attempt token refresh and retry
    if (response.status === 401 && !options._retry) {
      try {
        await this.refreshAuthToken();
        
        // Retry the request with new token
        return await this.request(endpoint, {
          ...options,
          _retry: true
        });
      } catch (refreshError) {
        // Token refresh failed, throw authentication error
        throw new Error('Session expired. Please log in again.');
      }
    }
    
    // Parse response body
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle error responses
    if (!response.ok) {
      throw {
        status: response.status,
        statusText: response.statusText,
        data: data,
        response: response
      };
    }
    
    // Return data from ResponseSchema wrapper or raw data
    return data.data !== undefined ? data.data : data;
  }

  /**
   * Handle request errors
   * @param {Error} error - Error object
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Original request options
   * @returns {Promise<never>} Throws translated error
   */
  async handleError(error, endpoint, options) {
    // Handle abort/timeout errors
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    // Handle HTTP error responses
    if (error.status) {
      const translatedError = this.translateError(error);
      throw translatedError;
    }
    
    // Handle unknown errors
    throw new Error(error.message || 'An unexpected error occurred. Please try again.');
  }

  /**
   * Translate HTTP errors to user-friendly messages
   * @param {Object} error - Error object with status and data
   * @returns {Error} Translated error
   */
  translateError(error) {
    const status = error.status;
    const errorData = error.data;
    
    // Try to extract message from error response
    let message = errorData?.message || errorData?.error || errorData?.detail;
    
    // Fallback to status-based messages
    if (!message) {
      const statusMessages = {
        400: 'Invalid request. Please check your input.',
        401: 'Authentication required. Please log in.',
        403: 'You do not have permission to perform this action.',
        404: 'Resource not found.',
        409: 'Conflict. The resource already exists.',
        422: 'Validation error. Please check your input.',
        500: 'Server error. Please try again later.',
        503: 'Service temporarily unavailable. Please try again later.'
      };
      
      message = statusMessages[status] || `Request failed with status ${status}`;
    }
    
    const translatedError = new Error(message);
    translatedError.status = status;
    translatedError.originalError = error;
    
    return translatedError;
  }

  /**
   * Make GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Request configuration
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'GET'
    });
  }

  /**
   * Make POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} config - Request configuration
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = null, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} config - Request configuration
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = null, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make PATCH request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @param {Object} config - Request configuration
   * @returns {Promise<any>} Response data
   */
  async patch(endpoint, data = null, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * Make DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Request configuration
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, config = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;

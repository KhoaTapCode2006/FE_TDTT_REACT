import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Create configured axios instance for notification API
 */
const notificationClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
notificationClient.interceptors.request.use(
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
 * Response interceptor - Handle response errors
 */
notificationClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
    appError.code = 'SERVER_ERROR';
    appError.statusCode = error.response.status;
    appError.message = error.response.data?.message || error.message;
    
    if (error.response.status === 404) {
      appError.message = 'Notification not found';
    } else if (error.response.status === 403) {
      appError.message = error.response.data?.message || 'Permission denied';
    }
  } else if (error.request) {
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
  console.error('Notification service error:', appError);
  
  return appError;
}

// ============================================================================
// SERVICE INTERFACE - PUBLIC API METHODS
// ============================================================================

/**
 * Notification Service - Manages notification operations via HTTP API
 */
export const notificationService = {
  /**
   * Mark a notification as read
   * Endpoint: PATCH /users/me/notifications/{notification_id}
   * 
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} Network or permission error
   */
  async markAsRead(notificationId) {
    const response = await notificationClient.patch(
      `/users/me/notifications/${notificationId}`,
      { read: true }
    );
    return response.status === 200;
  },

  /**
   * Update invitation status (accept or decline)
   * Endpoint: PATCH /invitations/{invitation_id}
   * 
   * @param {string} invitationId - Invitation ID
   * @param {'accepted'|'declined'} status - New invitation status
   * @returns {Promise<boolean>} Success status
   * @throws {Error} Network or permission error
   */
  async updateInvitation(invitationId, status) {
    const response = await notificationClient.patch(
      `/invitations/${invitationId}`,
      { status }
    );
    return response.status === 200;
  },
};

export default notificationService;

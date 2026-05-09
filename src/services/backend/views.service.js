import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {'weekly'|'all_time'} TopType
 */

/**
 * @typedef {'collections'|'hotels'|'places'} TargetType
 */

/**
 * @typedef {Object} TopViewsParams
 * @property {TargetType} target_type - Type of target to get top views for
 * @property {TopType} [top_type='all_time'] - Time period for top views
 * @property {number} [limit=10] - Number of results to return
 * @property {number} [page=1] - Page number for pagination
 */

/**
 * @typedef {Object} TopViewsResponse
 * @property {number} status_code - HTTP status code
 * @property {string} message - Response message
 * @property {Object} data - Response data
 * @property {Array} data.items - Array of top viewed items
 * @property {number} data.total - Total number of items
 * @property {number} data.page - Current page
 * @property {number} data.limit - Items per page
 * @property {boolean} data.has_more - Whether there are more pages
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Create configured axios instance for views API
 */
const viewsClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token if available
 */
viewsClient.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to get auth token for views API:', error);
        // Continue without token - views API may work without auth
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors
 */
viewsClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Views API error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// SERVICE INTERFACE - PUBLIC API METHODS
// ============================================================================

/**
 * Views Service - Manages view tracking and top views
 */
export const viewsService = {
  /**
   * Get top viewed items
   * Endpoint: GET /views/top
   * 
   * @param {TopViewsParams} params - Query parameters
   * @returns {Promise<TopViewsResponse>} Top views data
   * @throws {Error} Network or server error
   */
  async getTopViews({ target_type, top_type = 'all_time', limit = 10, page = 1 }) {
    try {
      const response = await viewsClient.get('/views/top', {
        params: {
          target_type,
          top_type,
          limit,
          page,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get top views:', error);
      throw new Error(error.response?.data?.message || 'Failed to load top views');
    }
  },

  /**
   * Get top collections (convenience method)
   * 
   * @param {TopType} [topType='all_time'] - Time period
   * @param {number} [limit=10] - Number of results
   * @param {number} [page=1] - Page number
   * @returns {Promise<TopViewsResponse>} Top collections
   */
  async getTopCollections(topType = 'all_time', limit = 10, page = 1) {
    return this.getTopViews({
      target_type: 'collections',
      top_type: topType,
      limit,
      page,
    });
  },

  /**
   * Record a view for a target
   * Endpoint: POST /views
   * 
   * @param {string} targetId - ID of the target being viewed
   * @param {TargetType} targetType - Type of target
   * @returns {Promise<Object>} View record response
   */
  async recordView(targetId, targetType) {
    try {
      const response = await viewsClient.post('/views', {
        target_id: targetId,
        target_type: targetType,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to record view:', error);
      // Don't throw - view tracking is not critical
      return null;
    }
  },
};

export default viewsService;

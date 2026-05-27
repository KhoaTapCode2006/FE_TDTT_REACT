import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';

/**
 * Liked Collections Service for handling liked collections operations via backend REST API
 * Manages user's liked collections with optimistic UI updates
 */
class LikedCollectionsService {
  constructor() {
    // No initialization needed - using API client
  }

  /**
   * Ensure we have a valid token before making API calls
   * @returns {Promise<void>}
   */
  async ensureValidToken() {
    try {
      const token = await tokenManager.getToken();
      apiClient.setAuthToken(token);
    } catch (error) {
      console.error('Failed to get valid token:', error);
      throw new Error('Authentication required. Please log in again.');
    }
  }

  /**
   * Get all collections liked by the current user
   * @returns {Promise<Array>} Array of liked collections
   * @throws {Error} Network or authentication error
   */
  async getLikedCollections() {
    try {
      await this.ensureValidToken();
      
      // Get liked collections from backend
      // Note: Backend doesn't have a dedicated endpoint for liked collections
      // We need to get all collections and filter by savers
      const response = await apiClient.get('/me/collections');
      
      // Log response for debugging
      console.log('📦 /me/collections response:', response);
      
      // Handle different response formats
      let backendCollections;
      if (Array.isArray(response)) {
        // Response is already an array
        backendCollections = response;
      } else if (response && Array.isArray(response.collections)) {
        // Response is an object with collections array
        backendCollections = response.collections;
      } else if (response && typeof response === 'object') {
        // Response might have owned and collaborated arrays
        const owned = Array.isArray(response.owned) ? response.owned : [];
        const collaborated = Array.isArray(response.collaborated) ? response.collaborated : [];
        backendCollections = [...owned, ...collaborated];
      } else {
        // Unexpected format, return empty array
        console.warn('Unexpected response format from /me/collections:', response);
        backendCollections = [];
      }
      
      // Filter out invalid collections (without required fields)
      const validCollections = backendCollections.filter(col => {
        if (!col || typeof col !== 'object') return false;
        if (!col.id) {
          console.warn('Collection missing ID, skipping:', col);
          return false;
        }
        return true;
      });
      
      // Transform each valid collection to frontend format
      return validCollections.map(col => this.transformCollection(col));
    } catch (error) {
      console.error('Error fetching liked collections:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(error.message || 'Failed to fetch liked collections. Please try again.');
    }
  }

  /**
   * Like a collection
   * @param {string} collectionId - Collection ID to like
   * @returns {Promise<Object>} Liked collection
   * @throws {Error} Network or validation error
   */
  async likeCollection(collectionId) {
    try {
      await this.ensureValidToken();
      
      if (!collectionId) {
        throw new Error('Collection ID is required');
      }
      
      // Like collection via backend API
      const url = `/collections/${collectionId}/save`;
      const response = await apiClient.post(url);
      
      // Log response for debugging
      console.log('📦 POST /collections/{id}/save response:', response);
      
      // Handle response - might be collection object or success message
      if (response && response.collection) {
        return this.transformCollection(response.collection);
      } else if (response && (response.id || response.name)) {
        return this.transformCollection(response);
      }
      
      // Return minimal collection object if backend doesn't return full collection
      return { id: collectionId };
    } catch (error) {
      console.error('Error liking collection:', error);
      
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid collection ID. Please try again.');
      }
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to like collection. Please try again.');
    }
  }

  /**
   * Unlike a collection
   * @param {string} collectionId - Collection ID to unlike
   * @returns {Promise<Object>} Unliked collection
   * @throws {Error} Network or validation error
   */
  async unlikeCollection(collectionId) {
    try {
      await this.ensureValidToken();
      
      if (!collectionId) {
        throw new Error('Collection ID is required');
      }
      
      // Unlike collection via backend API using unsave endpoint
      const url = `/collections/${collectionId}/unsave`;
      const response = await apiClient.post(url);
      
      // Log response for debugging
      console.log('📦 POST /collections/{id}/unsave response:', response);
      
      // Handle response - might be collection object or success message
      if (response && response.collection) {
        return this.transformCollection(response.collection);
      } else if (response && (response.id || response.name)) {
        return this.transformCollection(response);
      }
      
      // Return minimal collection object if backend doesn't return full collection
      return { id: collectionId };
    } catch (error) {
      console.error('Error unliking collection:', error);
      
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid collection ID. Please try again.');
      }
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found or already unliked.');
      }
      
      throw new Error(error.message || 'Failed to unlike collection. Please try again.');
    }
  }

  /**
   * Check if a collection is liked by the current user
   * @param {string} collectionId - Collection ID to check
   * @param {Array} likedCollections - Array of liked collections
   * @returns {boolean} True if collection is liked
   */
  isCollectionLiked(collectionId, likedCollections) {
    if (!Array.isArray(likedCollections)) {
      return false;
    }
    return likedCollections.some(c => c.id === collectionId);
  }

  /**
   * Transform backend collection to frontend format
   * @param {Object} collection - Backend collection object
   * @returns {Object} Frontend collection object
   * @private
   */
  transformCollection(collection) {
    if (!collection) return null;
    
    return {
      id: collection.id,
      owner_uid: collection.owner_uid,
      name: collection.name || '',
      description: collection.description || null,
      thumbnail_url: collection.thumbnail_url || null,
      created_at: collection.created_at ? new Date(collection.created_at) : null,
      updated_at: collection.updated_at ? new Date(collection.updated_at) : null,
      saved_count: collection.saved_count || 0,
      visibility: collection.visibility || 'public',
      tags: Array.isArray(collection.tags) ? collection.tags : [],
      places: Array.isArray(collection.places) ? collection.places.map(place => ({
        place_id: place.place_id,
        added_at: place.added_at ? new Date(place.added_at) : null,
        added_by: place.added_by
      })) : [],
      collaborators: Array.isArray(collection.collaborators) ? collection.collaborators.map(collab => ({
        uid: collab.uid,
        contributed_count: collab.contributed_count || 0,
        joined_at: collab.joined_at ? new Date(collab.joined_at) : null
      })) : [],
      savers: Array.isArray(collection.savers) ? collection.savers.map(saver => ({
        uid: saver.uid,
        saved_at: saver.saved_at ? new Date(saver.saved_at) : null
      })) : [],
      views: collection.views ? {
        total_views: collection.views.total_views || 0,
        weekly_views: collection.views.weekly_views || 0
      } : {
        total_views: 0,
        weekly_views: 0
      }
    };
  }

  /**
   * Transform array of collections
   * @param {Array} collections - Array of backend collections
   * @returns {Array} Array of frontend collections
   * @private
   */
  transformCollections(collections) {
    if (!Array.isArray(collections)) {
      return [];
    }
    return collections.map(c => this.transformCollection(c)).filter(c => c !== null);
  }
}

// Export singleton instance
export const likedCollectionsService = new LikedCollectionsService();
export default likedCollectionsService;

import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { 
  transformCollection, 
  transformCollectionCreate, 
  transformCollectionUpdate 
} from '../../utils/schemaTransformers.js';

/**
 * Collection service for handling collection operations via backend REST API
 * Replaces Firestore-based collection management with API calls
 */
class CollectionService {
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
   * Create a new collection
   * @param {string} userId - Owner user ID (not used, kept for backward compatibility)
   * @param {Object} collectionData - Collection data
   * @returns {Promise<Object>} Created collection with ID
   */
  async createCollection(userId, collectionData) {
    try {
      await this.ensureValidToken();
      
      // Transform frontend data to backend schema
      const backendData = transformCollectionCreate(collectionData);
      
      // Create collection via backend API
      const backendCollection = await apiClient.post('/collections', backendData);
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error creating collection:', error);
      
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid collection data. Please check your input.');
      }
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(error.message || 'Failed to create collection. Please try again.');
    }
  }

  /**
   * Fetch user's collections (owned or collaborated)
   * @param {string} userId - User ID (not used, kept for backward compatibility)
   * @returns {Promise<Array>} Array of collections
   */
  async fetchMyCollections(userId) {
    try {
      await this.ensureValidToken();
      
      // Get current user's collections from backend
      // Backend will return all collections (owned + collaborated)
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
        // Response is an object, might be a single collection or empty
        // Check if it has collection-like properties
        if (response.id || response.name || response.owner_uid) {
          backendCollections = [response];
        } else {
          // Empty object or unexpected structure
          console.warn('Unexpected response format from /me/collections:', response);
          backendCollections = [];
        }
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
      return validCollections.map(col => transformCollection(col));
    } catch (error) {
      console.error('Error fetching my collections:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(error.message || 'Failed to fetch collections. Please try again.');
    }
  }

  /**
   * Fetch public community collections
   * @param {number} limitCount - Maximum number of collections to fetch
   * @returns {Promise<Array>} Array of public collections
   */
  async fetchCommunityCollections(limitCount = 50) {
    try {
      // Public collections may not require authentication
      try {
        await this.ensureValidToken();
      } catch (error) {
        console.warn('No authentication token available for public collections request');
      }
      
      // Get public collections from backend
      const response = await apiClient.get(`/collections/public?limit=${limitCount}`);
      
      // Log response for debugging
      console.log('📦 /collections/public response:', response);
      
      // Handle different response formats
      let backendCollections;
      if (Array.isArray(response)) {
        // Response is already an array
        backendCollections = response;
      } else if (response && Array.isArray(response.collections)) {
        // Response is an object with collections array
        backendCollections = response.collections;
      } else if (response && typeof response === 'object') {
        // Response is an object, might be a single collection or empty
        // Check if it has collection-like properties
        if (response.id || response.name || response.owner_uid) {
          backendCollections = [response];
        } else {
          // Empty object or unexpected structure
          console.warn('Unexpected response format from /collections/public:', response);
          backendCollections = [];
        }
      } else {
        // Unexpected format, return empty array
        console.warn('Unexpected response format from /collections/public:', response);
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
      return validCollections.map(col => transformCollection(col));
    } catch (error) {
      console.error('Error fetching community collections:', error);
      throw new Error(error.message || 'Failed to fetch community collections. Please try again.');
    }
  }

  /**
   * Get a single collection by ID
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Object|null>} Collection data or null if not found
   */
  async getCollection(collectionId) {
    try {
      // Public collections may not require authentication
      try {
        await this.ensureValidToken();
      } catch (error) {
        console.warn('No authentication token available for collection request');
      }
      
      // Get collection from backend
      const backendCollection = await apiClient.get(`/collections/${collectionId}`);
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error getting collection:', error);
      
      if (error.status === 404) {
        return null;
      }
      
      throw new Error(error.message || 'Failed to retrieve collection. Please try again.');
    }
  }

  /**
   * Update a collection
   * @param {string} collectionId - Collection ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated collection
   */
  async updateCollection(collectionId, updateData) {
    try {
      await this.ensureValidToken();
      
      // Transform frontend data to backend schema
      const backendData = transformCollectionUpdate(updateData);
      
      // Update collection via backend API
      const backendCollection = await apiClient.patch(`/collections/${collectionId}`, backendData);
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error updating collection:', error);
      
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid collection data. Please check your input.');
      }
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 403) {
        throw new Error('You do not have permission to update this collection.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to update collection. Please try again.');
    }
  }

  /**
   * Delete a collection
   * @param {string} collectionId - Collection ID
   * @returns {Promise<void>}
   */
  async deleteCollection(collectionId) {
    try {
      await this.ensureValidToken();
      
      // Delete collection via backend API
      await apiClient.delete(`/collections/${collectionId}`);
    } catch (error) {
      console.error('Error deleting collection:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 403) {
        throw new Error('You do not have permission to delete this collection.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to delete collection. Please try again.');
    }
  }

  /**
   * Add multiple places to a collection
   * @param {string} collectionId - Collection ID
   * @param {Array<string>} placeIds - Array of place IDs to add
   * @returns {Promise<Object>} Updated collection
   */
  async addPlacesToCollection(collectionId, placeIds) {
    try {
      await this.ensureValidToken();
      
      // Validate input
      if (!Array.isArray(placeIds) || placeIds.length === 0) {
        throw new Error('Place IDs must be a non-empty array');
      }
      
      if (placeIds.length > 50) {
        throw new Error('Cannot add more than 50 places at once');
      }
      
      // Add places via backend API
      const backendCollection = await apiClient.post(`/collections/${collectionId}/places`, {
        place_ids: placeIds
      });
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error adding places to collection:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 403) {
        throw new Error('You do not have permission to modify this collection.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to add places to collection. Please try again.');
    }
  }

  /**
   * Remove multiple places from a collection
   * @param {string} collectionId - Collection ID
   * @param {Array<string>} placeIds - Array of place IDs to remove
   * @returns {Promise<Object>} Updated collection
   */
  async removePlacesFromCollection(collectionId, placeIds) {
    try {
      await this.ensureValidToken();
      
      // Validate input
      if (!Array.isArray(placeIds) || placeIds.length === 0) {
        throw new Error('Place IDs must be a non-empty array');
      }
      
      if (placeIds.length > 50) {
        throw new Error('Cannot remove more than 50 places at once');
      }
      
      // Remove places via backend API
      const backendCollection = await apiClient.delete(`/collections/${collectionId}/places`, {
        place_ids: placeIds
      });
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error removing places from collection:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 403) {
        throw new Error('You do not have permission to modify this collection.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to remove places from collection. Please try again.');
    }
  }

  /**
   * Add a hotel to a collection (backward compatibility wrapper)
   * @param {string} collectionId - Collection ID
   * @param {Object} hotelData - Hotel data to add
   * @returns {Promise<Object>} Updated collection
   */
  async addHotelToCollection(collectionId, hotelData) {
    // Extract hotel ID from hotelData
    const placeId = hotelData.id || hotelData.propertyToken || hotelData.placeId;
    
    if (!placeId) {
      throw new Error('Hotel data must contain an ID');
    }
    
    return this.addPlacesToCollection(collectionId, [placeId]);
  }

  /**
   * Remove a hotel from a collection (backward compatibility wrapper)
   * @param {string} collectionId - Collection ID
   * @param {Object} hotelData - Hotel data to remove
   * @returns {Promise<Object>} Updated collection
   */
  async removeHotelFromCollection(collectionId, hotelData) {
    // Extract hotel ID from hotelData
    const placeId = hotelData.id || hotelData.propertyToken || hotelData.placeId;
    
    if (!placeId) {
      throw new Error('Hotel data must contain an ID');
    }
    
    return this.removePlacesFromCollection(collectionId, [placeId]);
  }

  /**
   * Add multiple contributors to a collection
   * @param {string} collectionId - Collection ID
   * @param {Array<string>} contributorUids - Array of user IDs to add
   * @returns {Promise<Object>} Updated collection
   */
  async addContributors(collectionId, contributorUids) {
    try {
      await this.ensureValidToken();

      if (!Array.isArray(contributorUids) || contributorUids.length === 0) {
        throw new Error('Contributor UIDs must be a non-empty array');
      }

      if (contributorUids.length > 50) {
        throw new Error('Cannot add more than 50 contributors at once');
      }

      const backendCollection = await apiClient.post(`/collections/${collectionId}/contributors`, {
        contributor_uids: contributorUids,
      });

      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error adding contributors:', error);

      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to modify this collection.');
      }

      if (error.status === 404) {
        throw new Error('Collection not found.');
      }

      throw new Error(error.message || 'Failed to add contributors. Please try again.');
    }
  }

  /**
   * Remove multiple contributors from a collection
   * @param {string} collectionId - Collection ID
   * @param {Array<string>} contributorUids - Array of user IDs to remove
   * @returns {Promise<Object>} Updated collection
   */
  async removeContributors(collectionId, contributorUids) {
    try {
      await this.ensureValidToken();

      if (!Array.isArray(contributorUids) || contributorUids.length === 0) {
        throw new Error('Contributor UIDs must be a non-empty array');
      }

      if (contributorUids.length > 50) {
        throw new Error('Cannot remove more than 50 contributors at once');
      }

      const backendCollection = await apiClient.delete(`/collections/${collectionId}/contributors`, {
        data: { contributor_uids: contributorUids },
      });

      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error removing contributors:', error);

      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }

      if (error.status === 403) {
        throw new Error('You do not have permission to modify this collection.');
      }

      if (error.status === 404) {
        throw new Error('Collection not found.');
      }

      throw new Error(error.message || 'Failed to remove contributors. Please try again.');
    }
  }

  /**
   * @param {string} collectionId
   * @param {string} userId
   */
  async addContributor(collectionId, userId) {
    return this.addContributors(collectionId, [userId]);
  }

  /**
   * @param {string} collectionId
   * @param {string} userId
   */
  async removeContributor(collectionId, userId) {
    return this.removeContributors(collectionId, [userId]);
  }

  /**
   * Add multiple tags to a collection
   * @param {string} collectionId - Collection ID
   * @param {Array<string>} tags - Array of tags to add
   * @returns {Promise<Object>} Updated collection
   */
  async addTags(collectionId, tags) {
    try {
      await this.ensureValidToken();
      
      // Validate input
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('Tags must be a non-empty array');
      }
      
      if (tags.length > 50) {
        throw new Error('Cannot add more than 50 tags at once');
      }
      
      // Add tags via backend API
      const backendCollection = await apiClient.post(`/collections/${collectionId}/tags`, {
        tags: tags
      });
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error adding tags:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 403) {
        throw new Error('You do not have permission to modify this collection.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to add tags. Please try again.');
    }
  }

  /**
   * Remove multiple tags from a collection
   * @param {string} collectionId - Collection ID
   * @param {Array<string>} tags - Array of tags to remove
   * @returns {Promise<Object>} Updated collection
   */
  async removeTags(collectionId, tags) {
    try {
      await this.ensureValidToken();
      
      // Validate input
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('Tags must be a non-empty array');
      }
      
      if (tags.length > 50) {
        throw new Error('Cannot remove more than 50 tags at once');
      }
      
      // Remove tags via backend API
      const backendCollection = await apiClient.delete(`/collections/${collectionId}/tags`, {
        tags: tags
      });
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error removing tags:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 403) {
        throw new Error('You do not have permission to modify this collection.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to remove tags. Please try again.');
    }
  }

  /**
   * Save a collection (add to user's saved collections)
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Object>} Updated collection
   */
  async saveCollection(collectionId) {
    try {
      await this.ensureValidToken();
      
      // Save collection via backend API
      const backendCollection = await apiClient.post(`/collections/${collectionId}/save`);
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error saving collection:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to save collection. Please try again.');
    }
  }

  /**
   * Unsave a collection (remove from user's saved collections)
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Object>} Updated collection
   */
  async unsaveCollection(collectionId) {
    try {
      await this.ensureValidToken();
      
      // Unsave collection via backend API
      const backendCollection = await apiClient.post(`/collections/${collectionId}/unsave`);
      
      // Transform backend response to frontend format
      return transformCollection(backendCollection);
    } catch (error) {
      console.error('Error unsaving collection:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      if (error.status === 404) {
        throw new Error('Collection not found.');
      }
      
      throw new Error(error.message || 'Failed to unsave collection. Please try again.');
    }
  }

  /**
   * Increment save count for a collection (backward compatibility - now handled by backend)
   * @param {string} collectionId - Collection ID
   * @returns {Promise<void>}
   */
  async incrementSaveCount(collectionId) {
    // This is now handled automatically by the backend when saveCollection is called
    console.warn('incrementSaveCount is deprecated - save count is managed by backend');
  }

  /**
   * Search collections by tags
   * @param {Array} tags - Array of tags to search for
   * @param {boolean} publicOnly - Whether to search only public collections
   * @returns {Promise<Array>} Array of matching collections
   */
  async searchCollectionsByTags(tags, publicOnly = true) {
    try {
      // Public collections may not require authentication
      if (!publicOnly) {
        await this.ensureValidToken();
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      tags.forEach(tag => params.append('tags', tag));
      if (publicOnly) {
        params.append('public_only', 'true');
      }
      params.append('limit', '20');
      
      // Search collections via backend API
      const backendCollections = await apiClient.get(`/collections/search?${params.toString()}`);
      
      // Transform each collection to frontend format
      return backendCollections.map(col => transformCollection(col));
    } catch (error) {
      console.error('Error searching collections by tags:', error);
      throw new Error(error.message || 'Failed to search collections. Please try again.');
    }
  }
}

// Export singleton instance
export const collectionService = new CollectionService();
export default collectionService;
import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} CollectionPlace
 * @property {string} place_id - Unique identifier for the place
 * @property {Date} added_at - Timestamp when place was added
 * @property {string} added_by - UID of user who added the place
 */

/**
 * @typedef {Object} CollectionCollaborator
 * @property {string} uid - User unique identifier
 * @property {number} contributed_count - Number of places contributed
 * @property {Date} joined_at - Timestamp when collaborator joined
 */

/**
 * @typedef {Object} CollectionSaver
 * @property {string} uid - User unique identifier
 * @property {Date} saved_at - Timestamp when user saved the collection
 */

/**
 * @typedef {'public'|'unlisted'|'private'} CollectionVisibility
 */

/**
 * @typedef {Object} CollectionData
 * @property {string} id - Unique collection identifier
 * @property {string} owner_uid - UID of collection owner
 * @property {string} name - Collection name (3-32 characters)
 * @property {string|null} description - Collection description (max 512 characters)
 * @property {string|null} thumbnail_url - URL of collection thumbnail image
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 * @property {number} saved_count - Number of users who saved this collection
 * @property {CollectionVisibility} visibility - Collection visibility setting
 * @property {string[]} tags - Array of tag strings
 * @property {CollectionPlace[]} places - Array of places in collection
 * @property {CollectionCollaborator[]} collaborators - Array of collaborators
 * @property {CollectionSaver[]} savers - Array of users who saved collection
 */

/**
 * @typedef {Object} CreateCollectionRequest
 * @property {string} name - Collection name (3-32 characters)
 * @property {string} [description] - Collection description (max 512 characters)
 * @property {string[]} [tags] - Array of tags
 * @property {CollectionVisibility} [visibility='public'] - Visibility setting
 * @property {string} [thumbnail_url] - Thumbnail URL
 */

/**
 * @typedef {Object} UpdateCollectionRequest
 * @property {string} [name] - New collection name
 * @property {string} [description] - New description
 * @property {CollectionVisibility} [visibility] - New visibility setting
 * @property {string} [thumbnail_url] - New thumbnail URL
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'http://localhost:8000';

/**
 * Create configured axios instance for collection API
 * NOTE: Backend does NOT use /api/v1 prefix
 */
const collectionClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
collectionClient.interceptors.request.use(
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
collectionClient.interceptors.response.use(
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
      appError.message = 'Collection not found';
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
  console.error('Collection service error:', appError);
  
  return appError;
}

/**
 * Validate collection data before API call
 * @param {Object} data - Collection data to validate
 * @throws {Error} Validation error with code VALIDATION_ERROR
 */
function validateCollectionData(data) {
  const errors = [];
  
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.length < 3 || data.name.length > 32) {
      errors.push('Name must be between 3 and 32 characters');
    }
  }
  
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string' || data.description.length > 512) {
      errors.push('Description must be maximum 512 characters');
    }
  }
  
  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

/**
 * Validate array parameter
 * @param {Array} arr - Array to validate
 * @param {string} paramName - Parameter name for error message
 * @throws {Error} Validation error
 */
function validateArrayParam(arr, paramName) {
  if (!Array.isArray(arr) || arr.length === 0) {
    const error = new Error(`${paramName} must be a non-empty array`);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

// ============================================================================
// RESPONSE DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Extract collection data from API response
 * @param {Object} response - Axios response object
 * @returns {CollectionData} Collection data
 */
function extractCollectionData(response) {
  // Backend response format: { status_code, message, data: { collection: {...} } }
  const collection = response.data?.data?.collection;
  
  if (!collection) {
    throw new Error('Invalid response format from server');
  }
  
  // Transform date strings to Date objects
  return {
    ...collection,
    created_at: collection.created_at ? new Date(collection.created_at) : null,
    updated_at: collection.updated_at ? new Date(collection.updated_at) : null,
    places: (collection.places || []).map(place => ({
      ...place,
      added_at: place.added_at ? new Date(place.added_at) : null,
    })),
    collaborators: (collection.collaborators || []).map(collab => ({
      ...collab,
      joined_at: collab.joined_at ? new Date(collab.joined_at) : null,
    })),
    savers: (collection.savers || []).map(saver => ({
      ...saver,
      saved_at: saver.saved_at ? new Date(saver.saved_at) : null,
    })),
  };
}

/**
 * Extract boolean result from delete operation
 * @param {Object} response - Axios response object
 * @returns {boolean} Success status
 */
function extractBooleanResult(response) {
  return response.data?.data === true || response.status === 200;
}

// ============================================================================
// SERVICE INTERFACE - PUBLIC API METHODS
// ============================================================================

/**
 * Collection Service - Manages collection operations via HTTP API
 * 
 * IMPORTANT: All endpoints do NOT have trailing slashes
 * Backend is strict about URL format
 */
export const collectionService = {
  /**
   * Create a new collection
   * Endpoint: POST /collections
   * 
   * @param {CreateCollectionRequest} collectionData - Collection data
   * @returns {Promise<CollectionData>} Created collection
   * @throws {Error} Validation or network error
   */
  async createCollection(collectionData) {
    validateCollectionData(collectionData);
    
    const response = await collectionClient.post('/collections', collectionData);
    return extractCollectionData(response);
  },

  /**
   * Get collection details by ID
   * Endpoint: GET /collections/{collection_id}
   * 
   * @param {string} collectionId - Collection ID
   * @returns {Promise<CollectionData>} Collection data
   * @throws {Error} Not found or network error
   */
  async getCollection(collectionId) {
    const response = await collectionClient.get(`/collections/${collectionId}`);
    return extractCollectionData(response);
  },

  /**
   * Update collection metadata
   * Endpoint: PATCH /collections/{collection_id}
   * 
   * @param {string} collectionId - Collection ID
   * @param {UpdateCollectionRequest} updateData - Fields to update
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Permission denied or validation error
   */
  async updateCollection(collectionId, updateData) {
    validateCollectionData(updateData);
    
    const response = await collectionClient.patch(`/collections/${collectionId}`, updateData);
    return extractCollectionData(response);
  },

  /**
   * Delete a collection
   * Endpoint: DELETE /collections/{collection_id}
   * 
   * @param {string} collectionId - Collection ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} Permission denied or not found error
   */
  async deleteCollection(collectionId) {
    const response = await collectionClient.delete(`/collections/${collectionId}`);
    return extractBooleanResult(response);
  },

  /**
   * Add places to collection
   * Endpoint: POST /collections/{collection_id}/places
   * 
   * @param {string} collectionId - Collection ID
   * @param {string[]} placeIds - Array of place IDs to add
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Validation or permission error
   */
  async addPlacesToCollection(collectionId, placeIds) {
    validateArrayParam(placeIds, 'placeIds');
    
    const response = await collectionClient.post(
      `/collections/${collectionId}/places`,
      { place_ids: placeIds }
    );
    return extractCollectionData(response);
  },

  /**
   * Remove places from collection
   * Endpoint: DELETE /collections/{collection_id}/places
   * 
   * @param {string} collectionId - Collection ID
   * @param {string[]} placeIds - Array of place IDs to remove
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Validation or permission error
   */
  async removePlacesFromCollection(collectionId, placeIds) {
    validateArrayParam(placeIds, 'placeIds');
    
    const response = await collectionClient.delete(
      `/collections/${collectionId}/places`,
      { data: { place_ids: placeIds } }
    );
    return extractCollectionData(response);
  },

  /**
   * Add collaborators to collection
   * Endpoint: POST /collections/{collection_id}/collaborators
   * 
   * @param {string} collectionId - Collection ID
   * @param {string[]} collaboratorUids - Array of user UIDs to add
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Permission denied or validation error
   */
  async addCollaboratorsToCollection(collectionId, collaboratorUids) {
    validateArrayParam(collaboratorUids, 'collaboratorUids');
    
    const response = await collectionClient.post(
      `/collections/${collectionId}/collaborators`,
      { collaborator_uids: collaboratorUids }
    );
    return extractCollectionData(response);
  },

  /**
   * Remove collaborators from collection
   * Endpoint: DELETE /collections/{collection_id}/collaborators
   * 
   * @param {string} collectionId - Collection ID
   * @param {string[]} collaboratorUids - Array of user UIDs to remove
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Permission denied or validation error
   */
  async removeCollaboratorsFromCollection(collectionId, collaboratorUids) {
    validateArrayParam(collaboratorUids, 'collaboratorUids');
    
    const response = await collectionClient.delete(
      `/collections/${collectionId}/collaborators`,
      { data: { collaborator_uids: collaboratorUids } }
    );
    return extractCollectionData(response);
  },

  /**
   * Add tags to collection
   * Endpoint: POST /collections/{collection_id}/tags
   * 
   * @param {string} collectionId - Collection ID
   * @param {string[]} tags - Array of tags to add
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Validation error
   */
  async addTagsToCollection(collectionId, tags) {
    validateArrayParam(tags, 'tags');
    
    const response = await collectionClient.post(
      `/collections/${collectionId}/tags`,
      { tags }
    );
    return extractCollectionData(response);
  },

  /**
   * Remove tags from collection
   * Endpoint: DELETE /collections/{collection_id}/tags
   * 
   * @param {string} collectionId - Collection ID
   * @param {string[]} tags - Array of tags to remove
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Validation error
   */
  async removeTagsFromCollection(collectionId, tags) {
    validateArrayParam(tags, 'tags');
    
    const response = await collectionClient.delete(
      `/collections/${collectionId}/tags`,
      { data: { tags } }
    );
    return extractCollectionData(response);
  },

  /**
   * Get all collections owned by or collaborated on by current user
   * Endpoint: GET /me/collections
   * 
   * @returns {Promise<CollectionData[]>} Array of user's collections (owned + collaborated)
   * @throws {Error} Network or authentication error
   */
  async getMyCollections() {
    const response = await collectionClient.get('/me/collections');
    
    // Backend returns: { status_code, message, data: { owned: [...], collaborated: [...] } }
    const data = response.data?.data;
    
    if (!data) {
      throw new Error('Invalid response format from server');
    }
    
    // Merge owned and collaborated collections into single array
    const ownedCollections = data.owned || [];
    const collaboratedCollections = data.collaborated || [];
    const allCollections = [...ownedCollections, ...collaboratedCollections];
    
    // Transform each collection
    return allCollections.map(collection => ({
      ...collection,
      created_at: collection.created_at ? new Date(collection.created_at) : null,
      updated_at: collection.updated_at ? new Date(collection.updated_at) : null,
      places: (collection.places || []).map(place => ({
        ...place,
        added_at: place.added_at ? new Date(place.added_at) : null,
      })),
      collaborators: (collection.collaborators || []).map(collab => ({
        ...collab,
        joined_at: collab.joined_at ? new Date(collab.joined_at) : null,
      })),
      savers: (collection.savers || []).map(saver => ({
        ...saver,
        saved_at: saver.saved_at ? new Date(saver.saved_at) : null,
      })),
    }));
  },

  /**
   * Get all public collections (global/community collections)
   * Endpoint: GET /collections/global
   * 
   * @returns {Promise<CollectionData[]>} Array of public collections
   * @throws {Error} Network error
   */
  async getGlobalCollections() {
    const response = await collectionClient.get('/collections/global');
    
    // Backend returns: { status_code, message, data: { collections: [...] } }
    const collections = response.data?.data?.collections;
    
    if (!Array.isArray(collections)) {
      throw new Error('Invalid response format from server');
    }
    
    // Transform each collection
    return collections.map(collection => ({
      ...collection,
      created_at: collection.created_at ? new Date(collection.created_at) : null,
      updated_at: collection.updated_at ? new Date(collection.updated_at) : null,
      places: (collection.places || []).map(place => ({
        ...place,
        added_at: place.added_at ? new Date(place.added_at) : null,
      })),
      collaborators: (collection.collaborators || []).map(collab => ({
        ...collab,
        joined_at: collab.joined_at ? new Date(collab.joined_at) : null,
      })),
      savers: (collection.savers || []).map(saver => ({
        ...saver,
        saved_at: saver.saved_at ? new Date(saver.saved_at) : null,
      })),
    }));
  },

  /**
   * Save/bookmark a collection (add to user's saved collections)
   * Endpoint: POST /collections/{collection_id}/save
   * 
   * @param {string} collectionId - Collection ID to save
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Network error
   */
  async saveCollection(collectionId) {
    const response = await collectionClient.post(`/collections/${collectionId}/save`);
    return extractCollectionData(response);
  },

  /**
   * Unsave/unbookmark a collection (remove from user's saved collections)
   * Endpoint: DELETE /collections/{collection_id}/save
   * 
   * @param {string} collectionId - Collection ID to unsave
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Network error
   */
  async unsaveCollection(collectionId) {
    const response = await collectionClient.delete(`/collections/${collectionId}/save`);
    return extractCollectionData(response);
  },
};

export default collectionService;

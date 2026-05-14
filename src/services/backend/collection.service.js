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
 * @typedef {Object} CollectionContributor
 * @property {string} uid - User unique identifier
 * @property {string} [username]
 * @property {string} [display_name]
 * @property {string|null} [avatar_url]
 * @property {number} contributed_count - Number of places contributed
 * @property {Date} joined_at - Timestamp when contributor joined
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
 * @property {CollectionContributor[]} contributors - Array of contributors
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
 * Normalize one contributor row from API (GET list or embedded in collection)
 * @param {Object} row
 * @returns {Object|null}
 */
function normalizeContributorRow(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    ...row,
    joined_at: row.joined_at ? new Date(row.joined_at) : null,
  };
}

function contributorsFromCollectionPayload(collection) {
  const raw = collection.contributors ?? collection.collaborators ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeContributorRow).filter(Boolean);
}

/**
 * Extract collection data from API response
 * @param {Object} response - Axios response object
 * @returns {CollectionData} Collection data
 */
function extractCollectionData(response) {
  const collection = response.data?.data?.collection;
  
  if (!collection) {
    throw new Error('Invalid response format from server');
  }
  
  // Extract owner_uid from owner object or use existing owner_uid field
  const ownerUid = collection.owner?.uid ?? collection.owner_uid ?? null;
  
  // Transform date strings to Date objects
  const { collaborators: _legacyCollab, contributors: _ignored, ...restCollection } = collection;

  return {
    ...restCollection,
    owner_uid: ownerUid, // Ensure owner_uid is always present
    created_at: collection.created_at ? new Date(collection.created_at) : null,
    updated_at: collection.updated_at ? new Date(collection.updated_at) : null,
    places: (collection.places || []).map(place => ({
      ...place,
      added_at: place.added_at ? new Date(place.added_at) : null,
    })),
    contributors: contributorsFromCollectionPayload(collection),
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

/**
 * Normalize a collection summary from GET /me/my-collections, contributing, or saved
 * @param {Object} raw - Item from API `data` array
 * @returns {Object}
 */
function normalizeMeCollectionSummary(raw) {
  if (!raw || typeof raw !== 'object' || !raw.id) {
    return null;
  }
  const ownerUid = raw.owner?.uid ?? raw.owner_uid ?? null;
  const { collaborators: _legacyC, contributors: _legacyCtr, ...rawRest } = raw;
  return {
    ...rawRest,
    owner_uid: ownerUid,
    created_at: raw.created_at ? new Date(raw.created_at) : null,
    updated_at: raw.updated_at ? new Date(raw.updated_at) : null,
    places: Array.isArray(raw.places)
      ? raw.places.map((place) => ({
          ...place,
          added_at: place.added_at ? new Date(place.added_at) : null,
        }))
      : [],
    contributors: contributorsFromCollectionPayload(raw),
    savers: Array.isArray(raw.savers)
      ? raw.savers.map((saver) => ({
          ...saver,
          saved_at: saver.saved_at ? new Date(saver.saved_at) : null,
        }))
      : [],
    views: raw.views && typeof raw.views === 'object' ? { ...raw.views } : raw.views,
  };
}

/**
 * @param {Object} response - Axios response object
 * @returns {Object[]}
 */
function extractMeCollectionList(response) {
  const data = response.data?.data;
  if (!Array.isArray(data)) {
    throw new Error('Invalid response format from server');
  }
  return data.map(normalizeMeCollectionSummary).filter(Boolean);
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
   * List contributors for a collection
   * Endpoint: GET /collections/{collection_id}/contributors
   *
   * @param {string} collectionId - Collection ID
   * @returns {Promise<CollectionContributor[]>}
   */
  async getCollectionContributors(collectionId) {
    const response = await collectionClient.get(`/collections/${collectionId}/contributors`);
    const data = response.data?.data;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(normalizeContributorRow).filter(Boolean);
  },

  /**
   * Add contributors to collection
   * Endpoint: POST /collections/{collection_id}/contributors
   *
   * @param {string} collectionId - Collection ID
   * @param {string[]} contributorUids - Array of user UIDs to add
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Permission denied or validation error
   */
  async addContributorsToCollection(collectionId, contributorUids) {
    validateArrayParam(contributorUids, 'contributorUids');

    const response = await collectionClient.post(`/collections/${collectionId}/contributors`, {
      contributor_uids: contributorUids,
    });
    return extractCollectionData(response);
  },

  /**
   * Remove contributors from collection
   * Endpoint: DELETE /collections/{collection_id}/contributors
   *
   * @param {string} collectionId - Collection ID
   * @param {string[]} contributorUids - Array of user UIDs to remove
   * @returns {Promise<CollectionData>} Updated collection
   * @throws {Error} Permission denied or validation error
   */
  async removeContributorsFromCollection(collectionId, contributorUids) {
    validateArrayParam(contributorUids, 'contributorUids');

    const response = await collectionClient.delete(`/collections/${collectionId}/contributors`, {
      data: { contributor_uids: contributorUids },
    });
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
   * Collections the current user owns
   * Endpoint: GET /me/my-collections
   *
   * @returns {Promise<CollectionData[]>}
   */
  async getMyOwnedCollections() {
    const response = await collectionClient.get('/me/my-collections');
    return extractMeCollectionList(response);
  },

  /**
   * Collections the current user contributes to (not owner)
   * Endpoint: GET /me/contributing-collections
   *
   * @returns {Promise<CollectionData[]>}
   */
  async getContributingCollections() {
    const response = await collectionClient.get('/me/contributing-collections');
    return extractMeCollectionList(response);
  },

  /**
   * Collections saved by the current user
   * Endpoint: GET /me/saved-collections
   *
   * @returns {Promise<CollectionData[]>}
   */
  async getSavedCollections() {
    const response = await collectionClient.get('/me/saved-collections');
    return extractMeCollectionList(response);
  },

  /**
   * @deprecated Prefer getMyOwnedCollections / getContributingCollections / getSavedCollections
   * Endpoint: GET /me/my-collections
   */
  async getMyCollections() {
    return this.getMyOwnedCollections();
  },

  /**
   * Get all public collections (global/community collections)
   * Uses Views API to get latest public collections
   * Endpoint: GET /views/top
   * 
   * @param {number} [limit=20] - Number of collections to return
   * @returns {Promise<CollectionData[]>} Array of public collections
   * @throws {Error} Network error
   */
  async getGlobalCollections(limit = 20) {
    try {
      // Import views service dynamically to avoid circular dependency
      const { viewsService } = await import('./views.service');
      
      // Get latest collections using Views API
      const response = await viewsService.getTopCollections('all_time', limit, 1);
      
      const collections = response.data?.items || [];
      
      // Transform each collection (dates already transformed by viewsService)
      return collections;
    } catch (error) {
      console.error('Failed to get global collections:', error);
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  },

  /**
   * Get list of users who saved a collection
   * Endpoint: GET /collections/{collection_id}/savers
   *
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Array>} Array of users who saved this collection
   * @throws {Error} Network error
   */
  async getCollectionSavers(collectionId) {
    const response = await collectionClient.get(`/collections/${collectionId}/savers`);
    const data = response.data?.data;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.map(saver => ({
      ...saver,
      saved_at: saver.saved_at ? new Date(saver.saved_at) : null,
    }));
  },

  /**
   * Save/bookmark a collection (add to user's saved list)
   * Endpoint: POST /me/saved-collections
   * Body: { collection_id }
   *
   * @param {string} collectionId - Collection ID to save
   * @returns {Promise<boolean>} Success status
   * @throws {Error} Network error
   */
  async saveCollection(collectionId) {
    const response = await collectionClient.post('/me/saved-collections', {
      collection_id: collectionId,
    });
    return response.status === 200 || response.status === 201;
  },

  /**
   * Unsave/unbookmark a collection (remove from user's saved list)
   * Endpoint: DELETE /me/saved-collections/{collection_id}
   *
   * @param {string} collectionId - Collection ID to unsave
   * @returns {Promise<boolean>} Success status
   * @throws {Error} Network error
   */
  async unsaveCollection(collectionId) {
    const response = await collectionClient.delete(`/me/saved-collections/${collectionId}`);
    return response.status === 200 || response.status === 201;
  },
};

export default collectionService;

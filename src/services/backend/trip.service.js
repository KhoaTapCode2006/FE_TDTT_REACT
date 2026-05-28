import axios from 'axios';
import { auth } from '@/config/firebase';

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {'waiting'|'active'|'ended'} TripStatus
 */

/**
 * @typedef {Object} TripData
 * @property {string} id - Unique trip identifier
 * @property {string} owner_uid - UID of trip owner
 * @property {string} name - Trip name
 * @property {string|null} place_id - Google Place ID of the destination
 * @property {Date|null} start_at - Trip start timestamp
 * @property {Date|null} end_at - Trip end timestamp
 * @property {TripStatus} status - Trip status
 * @property {string[]} member_uids - Array of member UIDs
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} CreateTripRequest
 * @property {string} name - Trip name
 * @property {string} [place_id] - Google Place ID of the destination
 * @property {string} [start_at] - ISO date string for start date
 * @property {string} [end_at] - ISO date string for end date
 */

/**
 * @typedef {Object} UpdateTripRequest
 * @property {string} [name] - New trip name
 * @property {string} [place_id] - New place ID
 * @property {string} [start_at] - New start date (ISO string)
 * @property {string} [end_at] - New end date (ISO string)
 * @property {TripStatus} [status] - New trip status
 */

// ============================================================================
// HTTP CLIENT CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';


/**
 * Create configured axios instance for trip API
 * NOTE: Backend does NOT use /api/v1 prefix
 */
const tripClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add authentication token to all requests
 */
tripClient.interceptors.request.use(
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
tripClient.interceptors.response.use(
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
      appError.message = 'Trip not found';
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
  console.error('Trip service error:', appError);
  return appError;
}

/**
 * Validate trip data before API call
 * @param {Object} data - Trip data to validate
 * @throws {Error} Validation error with code VALIDATION_ERROR
 */
function validateTripData(data) {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    }
    if (data.name.length > 60) {
      errors.push('Name must be maximum 60 characters');
    }
  }

  if (data.start_at !== undefined && data.end_at !== undefined) {
    if (data.start_at && data.end_at && new Date(data.start_at) > new Date(data.end_at)) {
      errors.push('Start date must be before end date');
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
 * Transform raw API trip object into normalized UI format
 * @param {Object} t - Raw trip from API
 * @returns {TripData} Normalized trip data
 */
export function normalizeTripData(t) {
  console.log('[normalizeTripData] Raw trip data:', t);
  
  const fmt = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Hỗ trợ cả 2 format:
  // Format cũ: owner_uid (string), member_uids (string[]), members ([{uid, joined_at}])
  // Format mới: owner: { uid, ... }, member_count (number), không có member_uids

  // owner_uid
  const ownerUid = t.owner_uid ?? t.owner?.uid ?? '';

  // member uids
  let uids = [];
  let memberDetails = [];
  if (Array.isArray(t.members) && t.members.length > 0 && typeof t.members[0] === 'object') {
    memberDetails = t.members.filter((m) => m.uid).map((m) => ({ uid: m.uid, joined_at: m.joined_at || null }));
    uids = memberDetails.map((m) => m.uid);
  } else if (Array.isArray(t.member_uids)) {
    uids = t.member_uids;
    memberDetails = uids.map((uid) => ({ uid, joined_at: null }));
  }

  // member_count: ưu tiên field từ backend, fallback về độ dài mảng uids
  const memberCount = t.member_count ?? (uids.length > 0 ? uids.length : 0);

  // place_id: hỗ trợ cả string lẫn object
  const placeId = typeof t.place === 'string'
    ? t.place
    : (t.place?.place_id ?? t.place_id ?? '');

  const avatars = uids.slice(0, 2).map((uid) => uid.slice(0, 2).toUpperCase());
  const s = fmt(t.start_at);
  const e = fmt(t.end_at);

  const normalized = {
    id: t.id,
    owner_uid: ownerUid,
    owner: t.owner ?? null,
    title: t.name || 'Untitled Trip',
    place_id: placeId,
    place: t.place ?? null,
    status: t.status || 'waiting',
    dateRange: s && e ? `${s} - ${e}` : 'TBD',
    dateFrom: t.start_at ? new Date(t.start_at) : null,
    dateTo: t.end_at ? new Date(t.end_at) : null,
    members: memberCount,
    member_uids: uids,
    member_details: memberDetails,
    avatars,
    extra: Math.max(0, memberCount - 2),
    created_at: t.created_at ? new Date(t.created_at) : null,
    updated_at: t.updated_at ? new Date(t.updated_at) : null,
  };
  
  console.log('[normalizeTripData] Normalized trip:', normalized);
  return normalized;
}

/**
 * Extract trip data from API response
 * @param {Object} response - Axios response object
 * @returns {TripData} Normalized trip data
 */
function extractTripData(response) {
  // Backend response format: { status_code, message, data: { trip: {...} } }
  // or: { status_code, message, data: {...} }  (create/update trả về data trực tiếp)
  const raw = response.data?.data;
  const trip = raw?.trip ?? raw;
  if (!trip || typeof trip !== 'object' || !trip.id) {
    console.error('extractTripData: unexpected response shape', response.data);
    throw new Error('Invalid response format from server');
  }
  return normalizeTripData(trip);
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
 * Trip Service - Manages trip operations via HTTP API
 *
 * IMPORTANT: All endpoints do NOT have trailing slashes
 * Backend is strict about URL format
 */
export const tripService = {
  /**
   * Get current authenticated user info
   * Endpoint: GET /me
   *
   * @returns {Promise<Object>} User data including current_trip
   * @throws {Error} Network or authentication error
   */
  async getMe() {
    const response = await tripClient.get('/me');
    // Backend response format: { status_code, message, data: { user: {...} } }
    // or: { status_code, message, data: {...} }
    const user = response.data?.data?.user ?? response.data?.data ?? response.data;
    if (!user || typeof user !== 'object') {
      throw new Error('Invalid response format from server');
    }
    return user;
  },

  /**
   * Get all trips for the current user
   * Fetches user via GET /me to get current_trip, then fetches that trip.
   *
   * @returns {Promise<TripData[]>} Array of normalized trips (empty if no current_trip)
   * @throws {Error} Network or authentication error
   */
  async getMyTrips() {
    const me = await this.getMe();
    const currentTripId = me.current_trip ?? null;

    if (!currentTripId) return [];

    const trip = await this.getTrip(currentTripId);
    return [trip];
  },

  /**
   * Get a single trip by ID
   * Endpoint: GET /trips/{trip_id}
   *
   * @param {string} tripId - Trip ID
   * @returns {Promise<TripData>} Normalized trip data
   * @throws {Error} Not found or network error
   */
  async getTrip(tripId) {
    const response = await tripClient.get(`/trips/${tripId}`);
    return extractTripData(response);
  },

  /**
   * Create a new trip
   * Endpoint: POST /trips
   *
   * @param {CreateTripRequest} tripData - Trip data
   * @returns {Promise<TripData>} Created trip
   * @throws {Error} Validation or network error
   */
  async createTrip(tripData) {
    validateTripData(tripData);
    const response = await tripClient.post('/trips', tripData);
    return extractTripData(response);
  },

  /**
   * Update trip metadata
   * Endpoint: PATCH /trips/{trip_id}
   *
   * @param {string} tripId - Trip ID
   * @param {UpdateTripRequest} updateData - Fields to update
   * @returns {Promise<TripData>} Updated trip
   * @throws {Error} Permission denied or validation error
   */
  async updateTrip(tripId, updateData) {
    validateTripData(updateData);
    const response = await tripClient.patch(`/trips/${tripId}`, updateData);
    return extractTripData(response);
  },

  /**
   * Delete a trip
   * Endpoint: DELETE /trips/{trip_id}
   *
   * @param {string} tripId - Trip ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} Permission denied or not found error
   */
  async deleteTrip(tripId) {
    const response = await tripClient.delete(`/trips/${tripId}`);
    return extractBooleanResult(response);
  },

  /**
   * Add members to a trip
   * Endpoint: POST /trips/{trip_id}/members
   *
   * @param {string} tripId - Trip ID
   * @param {string[]} memberUids - Array of user UIDs to add
   * @returns {Promise<TripData>} Updated trip
   * @throws {Error} Validation or permission error
   */
  async addMembersToTrip(tripId, memberUids) {
    validateArrayParam(memberUids, 'memberUids');
    const response = await tripClient.post(`/trips/${tripId}/members`, {
      member_uids: memberUids,
    });
    return extractTripData(response);
  },

  /**
   * Remove members from a trip
   * Endpoint: DELETE /trips/{trip_id}/members
   *
   * @param {string} tripId - Trip ID
   * @param {string[]} memberUids - Array of user UIDs to remove
   * @returns {Promise<TripData>} Updated trip
   * @throws {Error} Validation or permission error
   */
  async removeMembersFromTrip(tripId, memberUids) {
    validateArrayParam(memberUids, 'memberUids');
    const response = await tripClient.delete(`/trips/${tripId}/members`, {
      data: { member_uids: memberUids },
    });
    return extractTripData(response);
  },

  /**
   * Get all members of a trip
   * Endpoint: GET /trips/{trip_id}/members
   *
   * @param {string} tripId - Trip ID
   * @returns {Promise<Array<{uid, username, display_name, avatar_url, joined_at, tracking}>>} Array of member objects
   * @throws {Error} Not found or network error
   */
  async getTripMembers(tripId) {
    const response = await tripClient.get(`/trips/${tripId}/members`);
    // Backend returns: { status_code, message, data: [ { uid, username, display_name, avatar_url, joined_at, tracking } ] }
    const data = response.data?.data;
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from server');
    }
    return data;
  },
};

// ============================================================================
// MOCK DATA (temporary - replace with real API calls)
// ============================================================================

const MOCK_API_TRIPS = [
  {
    id: 'trip_001',
    owner_uid: 'nGUVEXtQgqhvxmaxHplZ93sPomm2',
    name: 'Đà Lạt mùa hoa',
    place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    start_at: '2026-06-10T00:00:00.000Z',
    end_at: '2026-06-15T00:00:00.000Z',
    status: 'waiting',
    member_uids: ['uid_kaka_007', 'uid_sarah_001', 'uid_alex_001'],
    created_at: '2026-05-05T04:55:31.315Z',
    updated_at: '2026-05-05T04:55:31.315Z',
  },
  {
    id: 'trip_002',
    owner_uid: 'uid_sophie_001',
    name: 'Hội An phố cổ',
    place_id: 'ChIJoRgWd1dZRjERh7a0ynfNjvM',
    start_at: '2026-05-01T00:00:00.000Z',
    end_at: '2026-05-08T00:00:00.000Z',
    status: 'active',
    member_uids: ['uid_sophie_001', 'uid_pierre_001', 'uid_claire_001'],
    created_at: '2026-04-20T09:00:00.000Z',
    updated_at: '2026-05-01T08:30:00.000Z',
  },
  {
    id: 'trip_003',
    owner_uid: 'uid_kenji_001',
    name: 'Hà Nội mùa thu',
    place_id: 'ChIJ85bPwnNrNTERSBnRFcgQ6Ys',
    start_at: '2026-03-15T00:00:00.000Z',
    end_at: '2026-03-20T00:00:00.000Z',
    status: 'ended',
    member_uids: ['uid_kenji_001', 'uid_yuki_001', 'uid_hana_001'],
    created_at: '2026-03-01T10:00:00.000Z',
    updated_at: '2026-03-20T18:00:00.000Z',
  },
];

export const MOCK_TRIPS = MOCK_API_TRIPS.map(normalizeTripData);

export default tripService;
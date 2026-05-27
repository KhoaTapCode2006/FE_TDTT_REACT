import axios from 'axios';
import { auth } from '../../config/firebase';

const API_BASE_URL = import.meta.env.VITE_LOCAL_API || 'https://api.haubaka.xyz';

// Create axios instance for discover API
const discoverClient = axios.create({
  baseURL: `${API_BASE_URL}/discover`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
discoverClient.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
discoverClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        code: 'TIMEOUT_ERROR',
        message: 'Request timeout',
        originalError: error,
      });
    }

    if (!error.response) {
      return Promise.reject({
        code: 'NETWORK_ERROR',
        message: 'Network error',
        originalError: error,
      });
    }

    const { status, data } = error.response;

    if (status === 401) {
      return Promise.reject({
        code: 'AUTH_ERROR',
        message: data?.message || 'Authentication failed',
        statusCode: status,
        originalError: error,
      });
    }

    if (status === 400) {
      return Promise.reject({
        code: 'VALIDATION_ERROR',
        message: data?.message || 'Validation error',
        statusCode: status,
        originalError: error,
      });
    }

    return Promise.reject({
      code: 'SERVER_ERROR',
      message: data?.message || 'Server error',
      statusCode: status,
      originalError: error,
    });
  }
);

/**
 * Search hotels by name and GPS coordinates
 * @param {string} name - Hotel name search query
 * @param {Object} gps - GPS coordinates
 * @param {number} gps.latitude - Latitude coordinate
 * @param {number} gps.longitude - Longitude coordinate
 * @param {Object} options - Request options
 * @param {AbortSignal} options.signal - Abort signal for cancellation
 * @returns {Promise<Array>} Array of hotel objects
 */

/**
 * @typedef {Object} AddressSuggestion
 * @property {string}      ref_id    - Place ID to use when creating/updating a trip
 * @property {string|null} name      - Place name
 * @property {string|null} address   - Full address string
 * @property {string|null} display   - Display label (usually "name, address")
 * @property {number}      distance  - Distance in metres (-1 if unknown)
 */

/**
 * Suggest addresses based on a free-text query.
 * Endpoint: POST /discover/address-suggest
 *
 * @param {string} query - Search text typed by the user
 * @param {{ latitude: number, longitude: number }|null} [gps] - Optional GPS hint
 * @returns {Promise<AddressSuggestion[]>}
 */
export async function suggestAddress(query, gps = null) {
  if (!query || !query.trim()) return [];

  const body = { query: query.trim() };
  if (gps?.latitude != null && gps?.longitude != null) {
    body.gps = { latitude: gps.latitude, longitude: gps.longitude };
  }

  const response = await discoverClient.post('/discover/address-suggest', body);
  return response.data?.data?.suggestions ?? [];
}

/**
 * @typedef {Object} HotelResult
 * @property {string}      property_token  - Place ID to use when creating/updating a trip
 * @property {string}      name            - Hotel name
 * @property {string|null} address         - Hotel address
 * @property {Object|null} gps_coordinates - { latitude, longitude, geohash }
 * @property {number|null} price           - Price per night
 * @property {string|null} deal            - Deal label if any
 * @property {Array}       images          - Array of { thumbnail, original_image }
 * @property {number}      raw_rating      - Raw rating score
 */

/**
 * Search hotels by name (and optional GPS location).
 * Endpoint: POST /discover/hotels
 *
 * @param {string} name - Hotel name to search
 * @param {{ latitude: number, longitude: number, geohash?: string }|null} [gps] - Optional GPS hint
 * @returns {Promise<HotelResult[]>}
 */
export async function searchHotels(name, gps = null) {
  if (!name || !name.trim()) return [];

  const body = { name: name.trim() };
  if (gps?.latitude != null && gps?.longitude != null) {
    body.gps = {
      latitude: gps.latitude,
      longitude: gps.longitude,
      ...(gps.geohash ? { geohash: gps.geohash } : {}),
    };
  }

  const response = await discoverClient.post('/discover/hotels', body);
  return response.data?.data ?? [];
}

/**
 * Get hotel details by property_token (place ID).
 * Endpoint: GET /discover/hotels/{hotel_id}
 *
 * @param {string} hotelId - property_token
 * @returns {Promise<HotelResult|null>}
 */
export async function getHotelById(hotelId) {
  if (!hotelId) return null;
  try {
    const response = await discoverClient.get(`/discover/hotels/${encodeURIComponent(hotelId)}`);
    return response.data?.data ?? null;
  } catch {
    return null;
  }
}

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
export const searchHotels = async (name, gps = { latitude: 10.75887508, longitude: 106.67538868 }, options = {}) => {
  try {
    const response = await discoverClient.post(
      '/hotels',
      { 
        name,
        gps: {
          latitude: gps.latitude,
          longitude: gps.longitude
        }
      },
      {
        signal: options.signal,
      }
    );

    if (response.data?.status_code === 200 && response.data?.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    throw error;
  }
};

export const discoverService = {
  searchHotels,
};

import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';

/**
 * Travel Preference Service
 * Handles user travel preference operations via backend REST API
 * Manages user's travel preferences survey responses
 * 
 * API Endpoint: PUT /me/travel-preference
 * Request Schema:
 * {
 *   weather_tolerance: "thap" | "trung_binh" | "cao",
 *   preferred_amenities: string[],
 *   must_have_amenities: string[],
 *   excluded_amenities: string[],
 *   preferred_location_tags: string[],
 *   disliked_location_tags: string[],
 *   notes: string
 * }
 */

/**
 * Ensure we have a valid token before making API calls
 * @returns {Promise<void>}
 */
async function ensureValidToken() {
  try {
    const token = await tokenManager.getToken();
    apiClient.setAuthToken(token);
  } catch (error) {
    console.error('Failed to get valid token:', error);
    throw new Error('Authentication required. Please log in again.');
  }
}

/**
 * Get user's current travel preferences
 * @returns {Promise<Object>} User's travel preference object
 * @throws {Error} If not authenticated or fetch fails
 */
export async function getTravelPreferences() {
  try {
    await ensureValidToken();
    
    const response = await apiClient.get('/me/travel-preference');
    
    if (!response || typeof response !== 'object') {
      console.warn('Travel preference response is invalid:', response);
      return null;
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching travel preferences:', error);
    
    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để xem sở thích du lịch');
    }
    
    if (error.status === 404) {
      // Preference not found - user hasn't filled survey yet
      return null;
    }
    
    throw new Error(error.message || 'Unable to load travel preferences. Please try again.');
  }
}

/**
 * Check if user has completed travel preference survey
 * @returns {Promise<boolean>} True if user has completed survey
 */
export async function hasCompletedSurvey() {
  try {
    const preferences = await getTravelPreferences();
    // If no preferences or weather_tolerance not set, survey not completed
    return preferences && preferences.weather_tolerance;
  } catch (error) {
    // If error occurs, assume survey not completed
    return false;
  }
}

/**
 * Save or update user's travel preferences
 * @param {Object} preferences - Travel preference data
 * @param {string} preferences.weather_tolerance - Weather tolerance level ("thap", "trung_binh", "cao")
 * @param {string[]} preferences.preferred_amenities - Preferred amenities
 * @param {string[]} preferences.must_have_amenities - Must-have amenities
 * @param {string[]} preferences.excluded_amenities - Excluded amenities
 * @param {string[]} preferences.preferred_location_tags - Preferred location tags
 * @param {string[]} preferences.disliked_location_tags - Disliked location tags
 * @param {string} preferences.notes - Additional notes
 * @returns {Promise<Object>} Updated preference object
 * @throws {Error} If not authenticated or request fails
 */
export async function updateTravelPreferences(preferences) {
  try {
    // Validate input
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Preferences must be an object');
    }
    
    await ensureValidToken();
    
    // Build request payload with only defined fields
    const payload = {
      weather_tolerance: preferences.weather_tolerance || null,
      preferred_amenities: Array.isArray(preferences.preferred_amenities) ? preferences.preferred_amenities : [],
      must_have_amenities: Array.isArray(preferences.must_have_amenities) ? preferences.must_have_amenities : [],
      excluded_amenities: Array.isArray(preferences.excluded_amenities) ? preferences.excluded_amenities : [],
      preferred_location_tags: Array.isArray(preferences.preferred_location_tags) ? preferences.preferred_location_tags : [],
      disliked_location_tags: Array.isArray(preferences.disliked_location_tags) ? preferences.disliked_location_tags : [],
      notes: preferences.notes || null
    };
    
    // Send to backend API
    const response = await apiClient.put('/me/travel-preference', payload);
    
    if (!response || typeof response !== 'object') {
      console.warn('Update response is invalid:', response);
      return payload;
    }
    
    return response;
  } catch (error) {
    console.error('Error updating travel preferences:', error);
    
    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để lưu sở thích du lịch');
    }
    
    if (error.status === 400) {
      throw new Error('Invalid preference data. Please check your input.');
    }
    
    throw new Error(error.message || 'Unable to save travel preferences. Please try again.');
  }
}

/**
 * Travel Preference Service class (singleton pattern)
 */
class TravelPreferenceService {
  /**
   * Get current user preferences
   * @returns {Promise<Object|null>}
   */
  async getPreferences() {
    return getTravelPreferences();
  }
  
  /**
   * Check if survey has been completed
   * @returns {Promise<boolean>}
   */
  async hasCompletedPreferenceSurvey() {
    return hasCompletedSurvey();
  }
  
  /**
   * Save preferences
   * @param {Object} preferences
   * @returns {Promise<Object>}
   */
  async savePreferences(preferences) {
    return updateTravelPreferences(preferences);
  }
}

// Export singleton instance
export const travelPreferenceService = new TravelPreferenceService();

// Export individual functions for direct use
export default travelPreferenceService;

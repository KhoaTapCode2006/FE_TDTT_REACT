import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';

/**
 * Favorites Service
 * Handles all favorite hotel operations via backend REST API
 * Favorites are managed through the /me/favourites-places endpoint
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8
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
 * Add hotel to favorite places
 * Requirements: 15.1, 15.2, 15.7
 * @param {string} placeId - Property token (place_id) to save
 * @returns {Promise<void>}
 * @throws {Error} If not authenticated or place_id is invalid
 */
export async function addFavoritePlace(placeId) {
  try {
    // Validate place_id
    if (!placeId || typeof placeId !== 'string') {
      console.error('❌ Invalid place_id:', placeId);
      throw new Error('Valid place_id is required');
    }

    await ensureValidToken();

    // Send only place_id to backend API
    const favoriteData = {
      place_id: placeId
    };

    // Add to favorite places via backend API
    await apiClient.post('/me/favourite-places', favoriteData);
  } catch (error) {
    console.error('Error adding favorite place:', error);

    if (error.message === 'Valid place_id is required') {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để lưu các địa điểm yêu thích');
    }

    if (error.status === 404) {
      throw new Error('Failed to add favorite: Invalid hotel ID. Please try again.');
    }

    if (error.status === 409) {
      throw new Error('Hotel already exists in favorites');
    }

    throw new Error(error.message || 'Unable to add hotel to favorites. Please try again.');
  }
}

/**
 * Remove hotel from favorite places
 * Requirements: 15.3, 15.4
 * @param {string} propertyToken - Property token (place_id)
 * @returns {Promise<void>}
 * @throws {Error} If not authenticated or property token is invalid
 */
export async function removeFavoritePlace(propertyToken) {
  try {
    if (!propertyToken) {
      throw new Error('Property token is required');
    }

    await ensureValidToken();

    // Remove from favorite places via backend API using propertyToken as place_id
    await apiClient.delete(`/me/favourite-places/${propertyToken}`);
  } catch (error) {
    console.error('Error removing favorite place:', error);

    if (error.message === 'Property token is required') {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để lưu các địa điểm yêu thích');
    }

    if (error.status === 404) {
      throw new Error('Favorite not found. It may have already been removed.');
    }

    throw new Error(error.message || 'Unable to remove hotel from favorites. Please try again.');
  }
}

/**
 * Get all favorite places for user
 * Requirements: 15.5, 15.6, 15.8
 * @returns {Promise<Array>} List of favorite places
 * @throws {Error} If not authenticated
 */
export async function getFavoritePlaces() {
  try {
    await ensureValidToken();

    // Get favorite places from backend API
    const response = await apiClient.get('/me/favourite-places');

    // Response should be an array of favorite places
    if (!Array.isArray(response)) {
      console.warn('Favorite places response is not an array:', response);
      return [];
    }

    // Transform to frontend format - handle place_id correctly
    return response.map(place => ({
      id: place.place_id || place.id,
      hotelId: place.place_id || place.id,
      propertyToken: place.place_id || place.id,
      name: place.name || 'Unknown Hotel',
      location: place.address || '',
      rating: place.rating || place.ai_score || 0,
      pricePerNight: place.pricePerNight || place.price || 0,
      currency: 'VND',
      // Handle images - extract first image URL for imageUrl
      imageUrl: Array.isArray(place.images) && place.images.length > 0
        ? (typeof place.images[0] === 'string' 
            ? place.images[0] 
            : place.images[0]?.thumbnail || place.images[0]?.original || place.images[0]?.url || null)
        : (place.thumbnail || null),
      images: Array.isArray(place.images) ? place.images : [],
      amenities: place.amenities || [],
      coordinates: place.gps_coordinates || place.coordinates || null,
      lat: place.gps_coordinates?.latitude || 0,
      lng: place.gps_coordinates?.longitude || 0,
      addedAt: place.added_at ? new Date(place.added_at) : new Date(),
    }));
  } catch (error) {
    console.error('Error fetching favorite places:', error);

    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để lưu các địa điểm yêu thích');
    }

    throw new Error(error.message || 'Unable to load favorites. Please try again.');
  }
}

/**
 * Check if hotel is favorited
 * Requirements: 15.5, 15.6
 * @param {string} propertyToken - Property token (hotel ID)
 * @returns {Promise<boolean>} True if favorited
 */
export async function isFavorite(propertyToken) {
  try {
    if (!propertyToken) {
      return false;
    }

    await ensureValidToken();

    // Get all favorite places
    const favoritePlaces = await apiClient.get('/me/favourites-places');

    if (!Array.isArray(favoritePlaces)) {
      return false;
    }

    // Check if hotel exists in favorite places using place_id
    return favoritePlaces.some(place => 
      place.place_id === propertyToken || place.id === propertyToken
    );
  } catch (error) {
    console.error('Error checking if hotel is favorite:', error);
    
    if (error.status === 401) {
      return false; // Not authenticated, so not favorited
    }
    
    return false;
  }
}

/**
 * Get favorite by hotel ID
 * Requirements: 15.5, 15.6
 * @param {string} propertyToken - Property token (hotel ID)
 * @returns {Promise<Object|null>} Favorite or null
 */
export async function getFavoriteByHotelId(propertyToken) {
  try {
    if (!propertyToken) {
      return null;
    }

    await ensureValidToken();

    // Get all favorite places
    const favoritePlaces = await apiClient.get('/me/favourites-places');

    if (!Array.isArray(favoritePlaces)) {
      return null;
    }

    // Find the place in favorite places using place_id
    const place = favoritePlaces.find(p => 
      p.place_id === propertyToken || p.id === propertyToken
    );

    if (!place) {
      return null;
    }

    // Transform to favorite format
    return {
      id: place.place_id || place.id,
      hotelId: place.place_id || place.id,
      propertyToken: place.place_id || place.id,
      name: place.name || 'Unknown Hotel',
      location: place.address || '',
      rating: place.rating || 0,
      pricePerNight: place.pricePerNight || place.price || 0,
      currency: 'VND',
      imageUrl: place.images?.[0] || place.thumbnail || null,
      images: place.images || [],
      amenities: place.amenities || [],
      coordinates: place.gps_coordinates || place.coordinates || null,
      lat: place.gps_coordinates?.latitude || 0,
      lng: place.gps_coordinates?.longitude || 0,
      addedAt: place.added_at ? new Date(place.added_at) : new Date(),
    };
  } catch (error) {
    console.error('Error getting favorite by hotel ID:', error);
    
    if (error.status === 401) {
      return null; // Not authenticated
    }
    
    return null;
  }
}

/**
 * Favorites Service class (singleton pattern)
 */
class FavoritesService {
  /**
   * Add hotel to favorites
   * @param {string} placeId - Property token (place_id) to save
   * @returns {Promise<void>}
   */
  async addFavorite(placeId) {
    return addFavoritePlace(placeId);
  }

  /**
   * Remove hotel from favorites
   * @param {string} propertyToken - Property token (place_id)
   * @returns {Promise<void>}
   */
  async removeFavorite(propertyToken) {
    return removeFavoritePlace(propertyToken);
  }

  /**
   * Get all favorites for user
   * @returns {Promise<Array>} List of favorites sorted by addedAt descending
   */
  async getFavorites() {
    return getFavoritePlaces();
  }

  /**
   * Check if hotel is favorited
   * @param {string} propertyToken - Property token (hotel ID)
   * @returns {Promise<boolean>} True if favorited
   */
  async isFavorite(propertyToken) {
    return isFavorite(propertyToken);
  }

  /**
   * Get favorite by hotel ID
   * @param {string} propertyToken - Property token (hotel ID)
   * @returns {Promise<Object|null>} Favorite or null
   */
  async getFavoriteByHotelId(propertyToken) {
    return getFavoriteByHotelId(propertyToken);
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();

// Export individual functions for direct use
export default favoritesService;

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
 * @param {Object} hotelData - Hotel data to save
 * @returns {Promise<void>}
 * @throws {Error} If not authenticated or hotel data is invalid
 */
export async function addFavoritePlace(hotelData) {
  try {
    if (!hotelData || !hotelData.id) {
      throw new Error('Hotel data with ID is required');
    }

    await ensureValidToken();

    // Prepare hotel data for backend
    const favoriteData = {
      id: hotelData.id || hotelData.propertyToken,
      name: hotelData.name || 'Unknown Hotel',
      address: hotelData.address || hotelData.location || '',
      rating: hotelData.rating || hotelData.ai_score || 0,
      pricePerNight: hotelData.pricePerNight || hotelData.price || 0,
      images: hotelData.images || [],
      amenities: hotelData.amenities || [],
      coordinates: hotelData.coordinates || {
        latitude: hotelData.lat || 0,
        longitude: hotelData.lng || hotelData.lon || 0
      }
    };

    // Add to favorite places via backend API
    await apiClient.post('/me/favourites-places', favoriteData);
  } catch (error) {
    console.error('Error adding favorite place:', error);

    if (error.message === 'Hotel data with ID is required') {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để lưu các địa điểm yêu thích');
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
 * @param {string} placeId - Place ID (hotel ID)
 * @returns {Promise<void>}
 * @throws {Error} If not authenticated or place ID is invalid
 */
export async function removeFavoritePlace(placeId) {
  try {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    await ensureValidToken();

    // Remove from favorite places via backend API
    await apiClient.delete(`/me/favourites-places?place_id=${placeId}`);
  } catch (error) {
    console.error('Error removing favorite place:', error);

    if (error.message === 'Place ID is required') {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Bạn phải đăng nhập để lưu các địa điểm yêu thích');
    }

    if (error.status === 404) {
      throw new Error('Favorite not found.');
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
    const response = await apiClient.get('/me/favourites-places');

    // Response should be an array of favorite places
    if (!Array.isArray(response)) {
      console.warn('Favorite places response is not an array:', response);
      return [];
    }

    // Transform to frontend format
    return response.map(place => ({
      id: place.id || place.place_id,
      hotelId: place.id || place.place_id,
      name: place.name || 'Unknown Hotel',
      location: place.address || '',
      rating: place.rating || 0,
      pricePerNight: place.pricePerNight || place.price || 0,
      currency: 'VND',
      imageUrl: place.images?.[0] || place.thumbnail || null,
      images: place.images || [],
      amenities: place.amenities || [],
      coordinates: place.coordinates || null,
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
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<boolean>} True if favorited
 */
export async function isFavorite(hotelId) {
  try {
    if (!hotelId) {
      return false;
    }

    await ensureValidToken();

    // Get all favorite places
    const favoritePlaces = await apiClient.get('/me/favourites-places');

    if (!Array.isArray(favoritePlaces)) {
      return false;
    }

    // Check if hotel exists in favorite places
    return favoritePlaces.some(place => 
      place.id === hotelId || place.place_id === hotelId
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
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<Object|null>} Favorite or null
 */
export async function getFavoriteByHotelId(hotelId) {
  try {
    if (!hotelId) {
      return null;
    }

    await ensureValidToken();

    // Get all favorite places
    const favoritePlaces = await apiClient.get('/me/favourites-places');

    if (!Array.isArray(favoritePlaces)) {
      return null;
    }

    // Find the place in favorite places
    const place = favoritePlaces.find(p => 
      p.id === hotelId || p.place_id === hotelId
    );

    if (!place) {
      return null;
    }

    // Transform to favorite format
    return {
      id: place.id || place.place_id,
      hotelId: place.id || place.place_id,
      name: place.name || 'Unknown Hotel',
      location: place.address || '',
      rating: place.rating || 0,
      pricePerNight: place.pricePerNight || place.price || 0,
      currency: 'VND',
      imageUrl: place.images?.[0] || place.thumbnail || null,
      images: place.images || [],
      amenities: place.amenities || [],
      coordinates: place.coordinates || null,
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
   * @param {Object} hotelData - Hotel data to save
   * @returns {Promise<void>}
   */
  async addFavorite(hotelData) {
    return addFavoritePlace(hotelData);
  }

  /**
   * Remove hotel from favorites
   * @param {string} placeId - Place ID (hotel ID)
   * @returns {Promise<void>}
   */
  async removeFavorite(placeId) {
    return removeFavoritePlace(placeId);
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
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<boolean>} True if favorited
   */
  async isFavorite(hotelId) {
    return isFavorite(hotelId);
  }

  /**
   * Get favorite by hotel ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Favorite or null
   */
  async getFavoriteByHotelId(hotelId) {
    return getFavoriteByHotelId(hotelId);
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();

// Export individual functions for direct use
export default favoritesService;

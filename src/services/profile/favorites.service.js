import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';

/**
 * Favorites Service
 * Handles all favorite hotel operations via backend REST API
 * Favorites are managed through the user's liked collection
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
 * Add hotel to favorites (adds to liked collection)
 * Requirements: 4.1, 4.2
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @param {Object} hotelData - Hotel data to save
 * @returns {Promise<Object>} Created favorite
 */
export async function addFavorite(userId, hotelData) {
  try {
    if (!hotelData || !hotelData.id) {
      throw new Error('Hotel data with ID is required');
    }

    await ensureValidToken();

    // Extract place ID from hotel data
    const placeId = hotelData.id || hotelData.propertyToken || hotelData.placeId;

    // Add to liked collection via backend API
    await apiClient.post(`/me/liked-collection?place_id=${placeId}`);

    // Return favorite object for backward compatibility
    return {
      id: placeId,
      hotelId: placeId,
      name: hotelData.name || 'Unknown Hotel',
      location: hotelData.address || hotelData.location || '',
      rating: hotelData.rating || 0,
      pricePerNight: hotelData.pricePerNight || 0,
      currency: hotelData.currency || 'VND',
      imageUrl: hotelData.images?.[0] || hotelData.image || hotelData.thumbnail || null,
      addedAt: new Date(),
    };
  } catch (error) {
    console.error('Error adding favorite:', error);

    if (error.message === 'Hotel data with ID is required') {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (error.status === 409) {
      throw new Error('Hotel already exists in favorites');
    }

    throw new Error(error.message || 'Unable to add hotel to favorites. Please try again.');
  }
}

/**
 * Remove hotel from favorites (removes from liked collection)
 * Requirements: 4.3
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @param {string} favoriteId - Favorite document ID (place ID)
 * @returns {Promise<void>}
 */
export async function removeFavorite(userId, favoriteId) {
  try {
    if (!favoriteId) {
      throw new Error('Favorite ID is required');
    }

    await ensureValidToken();

    // Remove from liked collection via backend API
    await apiClient.delete(`/me/liked-collection?place_id=${favoriteId}`);
  } catch (error) {
    console.error('Error removing favorite:', error);

    if (error.message === 'Favorite ID is required') {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (error.status === 404) {
      throw new Error('Favorite not found.');
    }

    throw new Error(error.message || 'Unable to remove hotel from favorites. Please try again.');
  }
}

/**
 * Get all favorites for user (gets liked collection)
 * Requirements: 4.4, 4.5
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @returns {Promise<Array>} List of favorites sorted by addedAt descending
 */
export async function getFavorites(userId) {
  try {
    await ensureValidToken();

    // Get user profile which includes liked collection
    const profile = await apiClient.get('/me');

    // Extract liked collection ID
    const likedCollectionId = profile.liked_collection;

    if (!likedCollectionId) {
      // No liked collection yet, return empty array
      return [];
    }

    // Get the liked collection details
    const collection = await apiClient.get(`/collections/${likedCollectionId}`);

    // Transform collection places to favorites format
    const favorites = (collection.places || []).map(place => ({
      id: place.place_id,
      hotelId: place.place_id,
      name: place.name || 'Unknown Hotel',
      location: place.address || '',
      rating: place.rating || 0,
      pricePerNight: place.price || 0,
      currency: 'VND',
      imageUrl: place.thumbnail || null,
      addedAt: place.added_at ? new Date(place.added_at) : new Date(),
    }));

    // Sort by addedAt descending (newest first)
    return favorites.sort((a, b) => b.addedAt - a.addedAt);
  } catch (error) {
    console.error('Error fetching favorites:', error);

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    throw new Error(error.message || 'Unable to load favorites. Please try again.');
  }
}

/**
 * Check if hotel is favorited
 * Requirements: 4.6
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<boolean>} True if favorited
 */
export async function isFavorite(userId, hotelId) {
  try {
    if (!hotelId) {
      return false;
    }

    await ensureValidToken();

    // Get user profile which includes liked collection
    const profile = await apiClient.get('/me');

    // Extract liked collection ID
    const likedCollectionId = profile.liked_collection;

    if (!likedCollectionId) {
      return false;
    }

    // Get the liked collection details
    const collection = await apiClient.get(`/collections/${likedCollectionId}`);

    // Check if hotel exists in places
    const places = collection.places || [];
    return places.some(place => place.place_id === hotelId);
  } catch (error) {
    console.error('Error checking if hotel is favorite:', error);
    return false;
  }
}

/**
 * Get favorite by hotel ID
 * Requirements: 4.6
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<Object|null>} Favorite or null
 */
export async function getFavoriteByHotelId(userId, hotelId) {
  try {
    if (!hotelId) {
      return null;
    }

    await ensureValidToken();

    // Get user profile which includes liked collection
    const profile = await apiClient.get('/me');

    // Extract liked collection ID
    const likedCollectionId = profile.liked_collection;

    if (!likedCollectionId) {
      return null;
    }

    // Get the liked collection details
    const collection = await apiClient.get(`/collections/${likedCollectionId}`);

    // Find the place in collection
    const places = collection.places || [];
    const place = places.find(p => p.place_id === hotelId);

    if (!place) {
      return null;
    }

    // Transform to favorite format
    return {
      id: place.place_id,
      hotelId: place.place_id,
      name: place.name || 'Unknown Hotel',
      location: place.address || '',
      rating: place.rating || 0,
      pricePerNight: place.price || 0,
      currency: 'VND',
      imageUrl: place.thumbnail || null,
      addedAt: place.added_at ? new Date(place.added_at) : new Date(),
    };
  } catch (error) {
    console.error('Error getting favorite by hotel ID:', error);
    return null;
  }
}

/**
 * Favorites Service class (singleton pattern)
 */
class FavoritesService {
  /**
   * Add hotel to favorites
   * @param {string} userId - User ID
   * @param {Object} hotelData - Hotel data to save
   * @returns {Promise<Object>} Created favorite
   */
  async addFavorite(userId, hotelData) {
    return addFavorite(userId, hotelData);
  }

  /**
   * Remove hotel from favorites
   * @param {string} userId - User ID
   * @param {string} favoriteId - Favorite document ID
   * @returns {Promise<void>}
   */
  async removeFavorite(userId, favoriteId) {
    return removeFavorite(userId, favoriteId);
  }

  /**
   * Get all favorites for user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of favorites sorted by addedAt descending
   */
  async getFavorites(userId) {
    return getFavorites(userId);
  }

  /**
   * Check if hotel is favorited
   * @param {string} userId - User ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<boolean>} True if favorited
   */
  async isFavorite(userId, hotelId) {
    return isFavorite(userId, hotelId);
  }

  /**
   * Get favorite by hotel ID
   * @param {string} userId - User ID
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object|null>} Favorite or null
   */
  async getFavoriteByHotelId(userId, hotelId) {
    return getFavoriteByHotelId(userId, hotelId);
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();

// Export individual functions for direct use
export default favoritesService;

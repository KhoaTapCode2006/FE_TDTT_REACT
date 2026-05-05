import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';

/**
 * Favorites Service
 * Handles all favorite hotel operations with Firestore
 * Uses subcollection structure: users/{userId}/favorites/{favoriteId}
 */

/**
 * Add hotel to favorites
 * Requirements: 4.1, 4.2
 * @param {string} userId - User ID
 * @param {Object} hotelData - Hotel data to save
 * @returns {Promise<Object>} Created favorite
 */
export async function addFavorite(userId, hotelData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!hotelData || !hotelData.id) {
      throw new Error('Hotel data with ID is required');
    }

    // Check if hotel already exists in favorites (prevent duplicates)
    const exists = await isFavorite(userId, hotelData.id);
    if (exists) {
      throw new Error('Hotel already exists in favorites');
    }

    const favoritesRef = collection(db, 'users', userId, 'favorites');
    
    const now = Timestamp.now();
    const favoriteToAdd = {
      hotelId: hotelData.id,
      name: hotelData.name || 'Unknown Hotel',
      location: hotelData.address || hotelData.location || '',
      rating: hotelData.rating || 0,
      pricePerNight: hotelData.pricePerNight || 0,
      currency: hotelData.currency || 'VND',
      imageUrl: hotelData.images?.[0] || hotelData.image || hotelData.thumbnail || null,
      addedAt: now,
    };

    const docRef = await addDoc(favoritesRef, favoriteToAdd);
    
    return {
      id: docRef.id,
      ...favoriteToAdd,
      addedAt: now.toDate(),
    };
  } catch (error) {
    console.error('Error adding favorite:', error);
    
    // Preserve specific error messages for validation and duplicate detection
    if (error.message === 'Hotel already exists in favorites' ||
        error.message === 'User ID is required' ||
        error.message === 'Hotel data with ID is required') {
      throw error;
    }
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to add favorites. Please log in again.');
    }
    
    throw new Error('Unable to add hotel to favorites. Please try again.');
  }
}

/**
 * Remove hotel from favorites
 * Requirements: 4.3
 * @param {string} userId - User ID
 * @param {string} favoriteId - Favorite document ID
 * @returns {Promise<void>}
 */
export async function removeFavorite(userId, favoriteId) {
  try {
    if (!userId || !favoriteId) {
      throw new Error('User ID and Favorite ID are required');
    }

    const favoriteRef = doc(db, 'users', userId, 'favorites', favoriteId);
    await deleteDoc(favoriteRef);
  } catch (error) {
    console.error('Error removing favorite:', error);
    
    if (error.message === 'User ID and Favorite ID are required') {
      throw error;
    }
    
    throw new Error('Unable to remove hotel from favorites. Please try again.');
  }
}

/**
 * Get all favorites for user
 * Requirements: 4.4, 4.5
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of favorites sorted by addedAt descending
 */
export async function getFavorites(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const favoritesRef = collection(db, 'users', userId, 'favorites');
    // Sort by addedAt descending (newest first)
    const q = query(favoritesRef, orderBy('addedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const favorites = [];
    querySnapshot.forEach((favoriteDoc) => {
      const favoriteData = favoriteDoc.data();
      favorites.push({
        id: favoriteDoc.id,
        ...favoriteData,
        addedAt: favoriteData.addedAt?.toDate ? favoriteData.addedAt.toDate() : new Date(favoriteData.addedAt),
      });
    });

    return favorites;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw new Error('Unable to load favorites. Please try again.');
  }
}

/**
 * Check if hotel is favorited
 * Requirements: 4.6
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<boolean>} True if favorited
 */
export async function isFavorite(userId, hotelId) {
  try {
    if (!userId || !hotelId) {
      return false;
    }

    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesRef, where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if hotel is favorite:', error);
    return false;
  }
}

/**
 * Get favorite by hotel ID
 * Requirements: 4.6
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<Object|null>} Favorite or null
 */
export async function getFavoriteByHotelId(userId, hotelId) {
  try {
    if (!userId || !hotelId) {
      return null;
    }

    const favoritesRef = collection(db, 'users', userId, 'favorites');
    const q = query(favoritesRef, where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const favoriteDoc = querySnapshot.docs[0];
    const favoriteData = favoriteDoc.data();
    
    return {
      id: favoriteDoc.id,
      ...favoriteData,
      addedAt: favoriteData.addedAt?.toDate ? favoriteData.addedAt.toDate() : new Date(favoriteData.addedAt),
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

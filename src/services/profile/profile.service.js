import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { transformUserProfile, transformUserProfileUpdate } from '../../utils/schemaTransformers.js';

/**
 * Profile service for handling user profile operations via backend REST API
 * Replaces Firestore-based profile management with API calls
 */
class ProfileService {
  constructor() {
    // No initialization needed - using API client
  }

  /**
   * Ensure we have a valid token before making API calls
   * @returns {Promise<void>}
   */
  async ensureValidToken() {
    try {
      const token = await tokenManager.getToken();
      apiClient.setAuthToken(token);
    } catch (error) {
      console.error('Failed to get valid token:', error);
      throw new Error('Authentication required. Please log in again.');
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile
   */
  async getCurrentUserProfile() {
    try {
      await this.ensureValidToken();
      
      // Get current user's profile from backend
      const backendProfile = await apiClient.get('/me');
      
      // Log response for debugging
      console.log('📦 /me response:', backendProfile);
      
      // Check if response is valid
      if (!backendProfile || typeof backendProfile !== 'object') {
        throw new Error('Invalid response from backend');
      }
      
      // Transform backend response to frontend format
      return transformUserProfile(backendProfile);
    } catch (error) {
      console.error('Error getting current user profile:', error);
      
      if (error.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(error.message || 'Failed to retrieve user profile. Please try again.');
    }
  }

  /**
   * Get user profile by UID (current user)
   * @param {string} uid - User ID (not used, kept for backward compatibility)
   * @returns {Promise<Object>} User profile
   */
  async getProfile(uid) {
    // Delegate to getCurrentUserProfile for backward compatibility
    return this.getCurrentUserProfile();
  }

  /**
   * Get user profile by username
   * @param {string} username - Username
   * @returns {Promise<Object>} Public user profile
   */
  async getUserProfile(username) {
    try {
      // Public profiles may not require authentication, but include token if available
      try {
        await this.ensureValidToken();
      } catch (error) {
        // Continue without token for public profiles
        console.warn('No authentication token available for public profile request');
      }
      
      // Get public profile from backend
      const backendProfile = await apiClient.get(`/users/${username}`);
      
      // Transform backend response to frontend format
      return transformUserProfile(backendProfile);
    } catch (error) {
      console.error('Error getting user profile:', error);
      
      if (error.status === 404) {
        throw new Error('User not found.');
      }
      
      throw new Error(error.message || 'Failed to retrieve user profile. Please try again.');
    }
  }

  /**
   * Get public user profile by username (alias for backward compatibility)
   * @param {string} username - Username
   * @returns {Promise<Object>} Public user profile
   */
  async getPublicProfile(username) {
    return this.getUserProfile(username);
  }

  /**
   * Update user profile
   * @param {string} userId - User ID (not used, kept for backward compatibility)
   * @param {Object} updateData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updateData) {
    try {
      await this.ensureValidToken();
      
      // Transform frontend data to backend schema
      const backendUpdateData = transformUserProfileUpdate(updateData);
      
      // Update profile via backend API
      const backendProfile = await apiClient.patch('/me', backendUpdateData);
      
      // Transform backend response to frontend format
      return transformUserProfile(backendProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.status === 400) {
        throw new Error(error.message || 'Invalid profile data. Please check your input.');
      }
      
      if (error.status === 409) {
        throw new Error('Username is already taken. Please choose a different username.');
      }
      
      throw new Error(error.message || 'Failed to update user profile. Please try again.');
    }
  }

  /**
   * Delete user profile
   * @param {string} userId - User ID (not used, kept for backward compatibility)
   * @returns {Promise<void>}
   */
  async deleteProfile(userId) {
    try {
      await this.ensureValidToken();
      
      // Delete profile via backend API
      await apiClient.delete('/me');
      
      // Profile deletion successful
      // Logout will be triggered by the calling code
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error(error.message || 'Failed to delete user profile. Please try again.');
    }
  }

  /**
   * Add collection to liked collections
   * @param {string} placeId - Place/collection ID
   * @returns {Promise<Object>} Updated profile
   */
  async addLikedCollection(placeId) {
    try {
      await this.ensureValidToken();
      
      // Add liked collection via backend API
      const backendProfile = await apiClient.post(`/me/liked-collection?place_id=${placeId}`);
      
      // Transform backend response to frontend format
      return transformUserProfile(backendProfile);
    } catch (error) {
      console.error('Error adding liked collection:', error);
      throw new Error(error.message || 'Failed to add collection to favorites. Please try again.');
    }
  }

  /**
   * Remove collection from liked collections
   * @param {string} placeId - Place/collection ID
   * @returns {Promise<Object>} Updated profile
   */
  async removeLikedCollection(placeId) {
    try {
      await this.ensureValidToken();
      
      // Remove liked collection via backend API
      const backendProfile = await apiClient.delete(`/me/liked-collection?place_id=${placeId}`);
      
      // Transform backend response to frontend format
      return transformUserProfile(backendProfile);
    } catch (error) {
      console.error('Error removing liked collection:', error);
      throw new Error(error.message || 'Failed to remove collection from favorites. Please try again.');
    }
  }

  /**
   * Upload user avatar
   * @param {string} uid - User ID
   * @param {File} file - Image file
   * @returns {Promise<string>} Avatar URL
   */
  async uploadAvatar(uid, file) {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPEG, PNG, GIF, or WebP).');
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image file size must be less than 5MB.');
      }

      // TODO: Upload to cloud storage service (Cloudinary, AWS S3, etc.)
      // For now, we'll use a placeholder implementation
      // In production, you would upload to your cloud storage service here
      
      // Example Cloudinary upload (commented out - needs configuration):
      /*
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      const uploadData = await uploadResponse.json();
      const avatarUrl = uploadData.secure_url;
      */
      
      // Placeholder: Create a data URL for the image
      const avatarUrl = await this.createImageDataUrl(file);
      
      // Update profile with new avatar URL
      await this.updateProfile(uid, { avatarUrl: avatarUrl });
      
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Create data URL from file (placeholder for cloud upload)
   * @param {File} file - Image file
   * @returns {Promise<string>} Data URL
   */
  createImageDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = (error) => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Update user preferences (kept for backward compatibility)
   * @param {string} uid - User ID
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Updated profile
   */
  async updatePreferences(uid, preferences) {
    // Preferences are part of the profile, so we update the profile
    return await this.updateProfile(uid, { preferences });
  }

  /**
   * Add booking to user's history (kept for backward compatibility)
   * @param {string} uid - User ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<void>}
   */
  async addBookingToHistory(uid, bookingId) {
    // This functionality would need to be implemented in the backend
    // For now, we'll just log it
    console.warn('addBookingToHistory is not yet implemented with backend API');
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;

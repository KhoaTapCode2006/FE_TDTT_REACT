import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase.js';

/**
 * Profile service for handling user profile operations with Firestore
 */
class ProfileService {
  constructor() {
    this.usersCollection = 'users';
  }

  /**
   * Create a new user profile
   * @param {string} uid - User ID
   * @param {Object} userData - User profile data
   * @returns {Promise<Object>} Created profile
   */
  async createProfile(uid, userData) {
    try {
      const profileData = {
        uid,
        email: userData.email,
        username: userData.username || this.generateUsername(userData.fullName),
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber || null,
        dateOfBirth: userData.dateOfBirth || null,
        gender: userData.gender || null,
        zipCode: userData.zipCode || null,
        memberTier: 'bronze', // Default tier
        avatar: userData.avatar || this.generateDefaultAvatar(userData.fullName),
        preferences: {
          language: 'en',
          currency: 'USD',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        },
        authProviders: userData.authProviders || ['password'],
        bookingHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      const userDocRef = doc(db, this.usersCollection, uid);
      await setDoc(userDocRef, profileData);
      
      return {
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error('Failed to create user profile. Please try again.');
    }
  }

  /**
   * Get user profile by UID
   * @param {string} uid - User ID
   * @returns {Promise<Object|null>} User profile or null if not found
   */
  async getProfile(uid) {
    try {
      const userDocRef = doc(db, this.usersCollection, uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          // Convert Firestore timestamps to Date objects
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate() || null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error('Failed to retrieve user profile. Please try again.');
    }
  }

  /**
   * Update user profile
   * @param {string} uid - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(uid, profileData) {
    try {
      const updateData = {
        ...profileData,
        updatedAt: serverTimestamp()
      };

      // Convert Date objects to Firestore timestamps for dateOfBirth
      if (profileData.dateOfBirth instanceof Date) {
        updateData.dateOfBirth = profileData.dateOfBirth;
      }

      const userDocRef = doc(db, this.usersCollection, uid);
      await updateDoc(userDocRef, updateData);
      
      // Return updated profile
      return await this.getProfile(uid);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update user profile. Please try again.');
    }
  }

  /**
   * Create or update profile (for social login)
   * @param {string} uid - User ID
   * @param {Object} userData - User data from social provider
   * @returns {Promise<Object>} Profile data
   */
  async createOrUpdateProfile(uid, userData) {
    try {
      const existingProfile = await this.getProfile(uid);
      
      if (existingProfile) {
        // Update existing profile with new provider info
        const updatedProviders = [...new Set([
          ...existingProfile.authProviders,
          ...userData.authProviders
        ])];
        
        const updateData = {
          authProviders: updatedProviders,
          lastLoginAt: new Date()
        };

        // Update avatar if it's from a social provider and user doesn't have one
        if (userData.avatar && (!existingProfile.avatar || !existingProfile.avatar.url)) {
          updateData.avatar = userData.avatar;
        }

        return await this.updateProfile(uid, updateData);
      } else {
        // Create new profile
        return await this.createProfile(uid, userData);
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      throw new Error('Failed to manage user profile. Please try again.');
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
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image file size must be less than 5MB.');
      }

      // Delete existing avatar if it exists
      const profile = await this.getProfile(uid);
      if (profile?.avatar?.url && profile.avatar.provider === 'upload') {
        try {
          const oldAvatarRef = ref(storage, `avatars/${uid}/avatar`);
          await deleteObject(oldAvatarRef);
        } catch (deleteError) {
          // Ignore delete errors for non-existent files
          console.warn('Could not delete old avatar:', deleteError);
        }
      }

      // Upload new avatar
      const avatarRef = ref(storage, `avatars/${uid}/avatar`);
      const snapshot = await uploadBytes(avatarRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update profile with new avatar
      await this.updateProfile(uid, {
        avatar: {
          url: downloadURL,
          provider: 'upload'
        }
      });

      return downloadURL;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Generate default Facebook-style avatar
   * @param {string} fullName - User's full name
   * @returns {Object} Avatar object with SVG data URL
   */
  generateDefaultAvatar(fullName) {
    const initials = this.getInitials(fullName);
    const colors = [
      '#1877F2', // Facebook blue
      '#42B883', // Vue green
      '#E44D26', // HTML orange
      '#F7DF1E', // JavaScript yellow
      '#61DAFB', // React cyan
      '#764ABC', // Redux purple
      '#FF6B6B', // Coral red
      '#4ECDC4', // Turquoise
      '#45B7D1', // Sky blue
      '#96CEB4'  // Mint green
    ];
    
    // Select color based on name hash
    const colorIndex = this.hashString(fullName) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Generate SVG
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="${backgroundColor}"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
              fill="white" text-anchor="middle" dominant-baseline="central">
          ${initials}
        </text>
      </svg>
    `;
    
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    
    return {
      url: dataUrl,
      provider: 'default'
    };
  }

  /**
   * Get initials from full name
   * @param {string} fullName - Full name
   * @returns {string} Initials (max 2 characters)
   */
  getInitials(fullName) {
    if (!fullName) return 'U';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Generate username from full name
   * @param {string} fullName - Full name
   * @returns {string} Generated username
   */
  generateUsername(fullName) {
    if (!fullName) return `user_${Date.now()}`;
    
    const baseUsername = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}${randomSuffix}`;
  }

  /**
   * Check if username is available
   * @param {string} username - Username to check
   * @param {string} excludeUid - UID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if available
   */
  async isUsernameAvailable(username, excludeUid = null) {
    try {
      const usersRef = collection(db, this.usersCollection);
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return true;
      }
      
      // If excluding a specific UID (for updates), check if it's the only match
      if (excludeUid) {
        const docs = querySnapshot.docs;
        return docs.length === 1 && docs[0].id === excludeUid;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Hash string to number for consistent color selection
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Add booking to user's history
   * @param {string} uid - User ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise<void>}
   */
  async addBookingToHistory(uid, bookingId) {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const updatedHistory = [...profile.bookingHistory, bookingId];
        await this.updateProfile(uid, {
          bookingHistory: updatedHistory
        });
      }
    } catch (error) {
      console.error('Error adding booking to history:', error);
      throw new Error('Failed to update booking history.');
    }
  }

  /**
   * Update user preferences
   * @param {string} uid - User ID
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Updated profile
   */
  async updatePreferences(uid, preferences) {
    try {
      const profile = await this.getProfile(uid);
      if (profile) {
        const updatedPreferences = {
          ...profile.preferences,
          ...preferences
        };
        
        return await this.updateProfile(uid, {
          preferences: updatedPreferences
        });
      }
      
      throw new Error('Profile not found');
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences.');
    }
  }
}

// Export singleton instance
export const profileService = new ProfileService();
export default profileService;
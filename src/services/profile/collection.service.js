import { 
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../config/firebase.js';

/**
 * Collection service for handling Firestore operations for user collections
 */
class CollectionService {
  constructor() {
    this.collectionName = 'collections';
  }

  /**
   * Create a new collection
   * @param {string} userId - Owner user ID
   * @param {Object} collectionData - Collection data
   * @returns {Promise<Object>} Created collection with ID
   */
  async createCollection(userId, collectionData) {
    try {
      const now = serverTimestamp();
      
      const newCollection = {
        ownerId: userId,
        name: collectionData.name || '',
        description: collectionData.description || '',
        tags: Array.isArray(collectionData.tags) ? collectionData.tags : [],
        visibility: collectionData.visibility || 'private',
        collaborators: Array.isArray(collectionData.collaborators) ? collectionData.collaborators : [],
        hotels: Array.isArray(collectionData.hotels) ? collectionData.hotels : [],
        saveCount: 0,
        createdAt: now,
        updatedAt: now
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, this.collectionName), newCollection);
      
      return {
        id: docRef.id,
        ...newCollection,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Fetch user's collections (owned or collaborated)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of collections
   */
  async fetchMyCollections(userId) {
    try {
      const collections = [];
      
      // Query collections where user is owner
      const ownerQuery = query(
        collection(db, this.collectionName),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const ownerSnapshot = await getDocs(ownerQuery);
      ownerSnapshot.forEach((doc) => {
        collections.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });

      // Query collections where user is collaborator
      const collaboratorQuery = query(
        collection(db, this.collectionName),
        where('collaborators', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const collaboratorSnapshot = await getDocs(collaboratorQuery);
      collaboratorSnapshot.forEach((doc) => {
        // Avoid duplicates if user is both owner and collaborator
        const existingCollection = collections.find(col => col.id === doc.id);
        if (!existingCollection) {
          collections.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          });
        }
      });

      // Sort by updatedAt descending
      return collections.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Error fetching my collections:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Fetch public community collections
   * @param {number} limitCount - Maximum number of collections to fetch
   * @returns {Promise<Array>} Array of public collections
   */
  async fetchCommunityCollections(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('visibility', '==', 'public'),
        orderBy('saveCount', 'desc'),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const collections = [];
      
      querySnapshot.forEach((doc) => {
        collections.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return collections;
    } catch (error) {
      console.error('Error fetching community collections:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Get a single collection by ID
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Object|null>} Collection data or null if not found
   */
  async getCollection(collectionId) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting collection:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Update a collection
   * @param {string} collectionId - Collection ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateCollection(collectionId, updateData) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      
      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error('Error updating collection:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Delete a collection
   * @param {string} collectionId - Collection ID
   * @returns {Promise<void>}
   */
  async deleteCollection(collectionId) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Add a hotel to a collection
   * @param {string} collectionId - Collection ID
   * @param {Object} hotelData - Hotel data to add
   * @returns {Promise<void>}
   */
  async addHotelToCollection(collectionId, hotelData) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      
      await updateDoc(docRef, {
        hotels: arrayUnion(hotelData),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding hotel to collection:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Remove a hotel from a collection
   * @param {string} collectionId - Collection ID
   * @param {Object} hotelData - Hotel data to remove
   * @returns {Promise<void>}
   */
  async removeHotelFromCollection(collectionId, hotelData) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      
      await updateDoc(docRef, {
        hotels: arrayRemove(hotelData),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing hotel from collection:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Add a collaborator to a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID to add as collaborator
   * @returns {Promise<void>}
   */
  async addCollaborator(collectionId, userId) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      
      await updateDoc(docRef, {
        collaborators: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Remove a collaborator from a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID to remove as collaborator
   * @returns {Promise<void>}
   */
  async removeCollaborator(collectionId, userId) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      
      await updateDoc(docRef, {
        collaborators: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Increment save count for a collection
   * @param {string} collectionId - Collection ID
   * @returns {Promise<void>}
   */
  async incrementSaveCount(collectionId) {
    try {
      const docRef = doc(db, this.collectionName, collectionId);
      
      await updateDoc(docRef, {
        saveCount: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing save count:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Search collections by tags
   * @param {Array} tags - Array of tags to search for
   * @param {boolean} publicOnly - Whether to search only public collections
   * @returns {Promise<Array>} Array of matching collections
   */
  async searchCollectionsByTags(tags, publicOnly = true) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('tags', 'array-contains-any', tags),
        orderBy('saveCount', 'desc'),
        limit(20)
      );

      if (publicOnly) {
        q = query(
          collection(db, this.collectionName),
          where('visibility', '==', 'public'),
          where('tags', 'array-contains-any', tags),
          orderBy('saveCount', 'desc'),
          limit(20)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const collections = [];
      
      querySnapshot.forEach((doc) => {
        collections.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return collections;
    } catch (error) {
      console.error('Error searching collections by tags:', error);
      throw this.translateFirebaseError(error);
    }
  }

  /**
   * Translate Firebase errors to user-friendly messages
   * @param {Error} error - Firebase error
   * @returns {Error} Translated error
   */
  translateFirebaseError(error) {
    console.error('Firebase error:', error.code, error.message);
    
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this action.',
      'not-found': 'The requested collection was not found.',
      'already-exists': 'A collection with this name already exists.',
      'invalid-argument': 'Invalid data provided. Please check your input.',
      'unavailable': 'Service is temporarily unavailable. Please try again later.',
      'unauthenticated': 'You must be signed in to perform this action.',
      'resource-exhausted': 'Too many requests. Please try again later.',
      'failed-precondition': 'Operation failed due to system constraints.',
      'aborted': 'Operation was aborted. Please try again.',
      'out-of-range': 'Operation was attempted past the valid range.',
      'unimplemented': 'Operation is not implemented or supported.',
      'internal': 'Internal error occurred. Please try again later.',
      'deadline-exceeded': 'Operation timed out. Please try again.',
      'cancelled': 'Operation was cancelled.'
    };
    
    const message = errorMessages[error.code] || error.message || 'An unexpected error occurred. Please try again.';
    
    const translatedError = new Error(message);
    translatedError.code = error.code;
    translatedError.originalError = error;
    
    return translatedError;
  }
}

// Export singleton instance
export const collectionService = new CollectionService();
export default collectionService;
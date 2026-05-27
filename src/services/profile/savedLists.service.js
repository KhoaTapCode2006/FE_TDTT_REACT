import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { transformBackendHotel } from '../backend/backend-data.service';

/**
 * Saved Lists Service
 * Handles all saved list operations with Firestore
 */

/**
 * Fetch all saved lists for a user with hotels
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of lists with hotels
 */
export async function fetchSavedLists(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const listsRef = collection(db, 'users', userId, 'savedLists');
    const listsSnapshot = await getDocs(listsRef);
    
    const lists = [];
    
    for (const listDoc of listsSnapshot.docs) {
      const listData = listDoc.data();
      
      // Fetch hotels for this list
      const hotelsRef = collection(db, 'users', userId, 'savedLists', listDoc.id, 'hotels');
      const hotelsSnapshot = await getDocs(hotelsRef);
      
      const hotels = [];
      hotelsSnapshot.forEach((hotelDoc) => {
        const hotelData = hotelDoc.data();
        hotels.push({
          id: hotelDoc.id,
          ...hotelData,
          addedAt: hotelData.addedAt?.toDate ? hotelData.addedAt.toDate() : new Date(hotelData.addedAt),
        });
      });
      
      lists.push({
        id: listDoc.id,
        ...listData,
        hotels,
        createdAt: listData.createdAt?.toDate ? listData.createdAt.toDate() : new Date(listData.createdAt),
        updatedAt: listData.updatedAt?.toDate ? listData.updatedAt.toDate() : new Date(listData.updatedAt),
      });
    }

    return lists;
  } catch (error) {
    console.error('Error fetching saved lists:', error);
    throw new Error('Không thể tải danh sách đã lưu. Vui lòng thử lại.');
  }
}

/**
 * Fetch a single list with hotels
 * @param {string} userId - User ID
 * @param {string} listId - List ID
 * @returns {Promise<Object>} List with hotels
 */
export async function getList(userId, listId) {
  try {
    if (!userId || !listId) {
      throw new Error('User ID and List ID are required');
    }

    const listRef = doc(db, 'users', userId, 'savedLists', listId);
    const listDoc = await getDoc(listRef);

    if (!listDoc.exists()) {
      throw new Error('List not found');
    }

    const listData = listDoc.data();
    
    // Fetch hotels for this list
    const hotelsRef = collection(db, 'users', userId, 'savedLists', listId, 'hotels');
    const hotelsSnapshot = await getDocs(hotelsRef);
    
    const hotels = [];
    hotelsSnapshot.forEach((hotelDoc) => {
      const hotelData = hotelDoc.data();
      hotels.push({
        id: hotelDoc.id,
        ...hotelData,
        addedAt: hotelData.addedAt?.toDate ? hotelData.addedAt.toDate() : new Date(hotelData.addedAt),
      });
    });

    return {
      id: listDoc.id,
      ...listData,
      hotels,
      createdAt: listData.createdAt?.toDate ? listData.createdAt.toDate() : new Date(listData.createdAt),
      updatedAt: listData.updatedAt?.toDate ? listData.updatedAt.toDate() : new Date(listData.updatedAt),
    };
  } catch (error) {
    console.error('Error fetching list:', error);
    throw new Error('Không thể tải danh sách. Vui lòng thử lại.');
  }
}

/**
 * Create a new saved list
 * @param {string} userId - User ID
 * @param {Object} listData - List data (name, description)
 * @returns {Promise<Object>} Created list
 */
export async function createList(userId, listData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!listData.name || listData.name.trim() === '') {
      throw new Error('List name is required');
    }

    const listsRef = collection(db, 'users', userId, 'savedLists');
    
    const now = Timestamp.now();
    const newList = {
      name: listData.name.trim(),
      description: listData.description?.trim() || '',
      count: 0,
      featured: listData.featured || false,
      image: listData.image || null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(listsRef, newList);
    
    return {
      id: docRef.id,
      ...newList,
      hotels: [],
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error('Error creating list:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('User ID:', userId);
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      throw new Error('Bạn không có quyền tạo danh sách. Vui lòng đăng nhập lại.');
    }
    
    if (error.message === 'List name is required' || error.message === 'User ID is required') {
      throw error;
    }
    
    throw new Error('Không thể tạo danh sách. Vui lòng thử lại.');
  }
}

/**
 * Update list metadata
 * @param {string} userId - User ID
 * @param {string} listId - List ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated list
 */
export async function updateList(userId, listId, updates) {
  try {
    if (!userId || !listId) {
      throw new Error('User ID and List ID are required');
    }

    const listRef = doc(db, 'users', userId, 'savedLists', listId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(listRef, updateData);
    
    // Fetch and return updated list
    return await getList(userId, listId);
  } catch (error) {
    console.error('Error updating list:', error);
    throw new Error('Không thể cập nhật danh sách. Vui lòng thử lại.');
  }
}

/**
 * Delete a saved list
 * @param {string} userId - User ID
 * @param {string} listId - List ID
 * @returns {Promise<void>}
 */
export async function deleteList(userId, listId) {
  try {
    if (!userId || !listId) {
      throw new Error('User ID and List ID are required');
    }

    // Delete all hotels in the list first
    const hotelsRef = collection(db, 'users', userId, 'savedLists', listId, 'hotels');
    const hotelsSnapshot = await getDocs(hotelsRef);
    
    const batch = writeBatch(db);
    hotelsSnapshot.forEach((hotelDoc) => {
      batch.delete(hotelDoc.ref);
    });
    
    // Delete the list itself
    const listRef = doc(db, 'users', userId, 'savedLists', listId);
    batch.delete(listRef);
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting list:', error);
    throw new Error('Không thể xóa danh sách. Vui lòng thử lại.');
  }
}

/**
 * Add hotel to a list
 * @param {string} userId - User ID
 * @param {string} listId - List ID
 * @param {Object} hotelData - Hotel data
 * @returns {Promise<void>}
 */
export async function addHotelToList(userId, listId, hotelData) {
  try {
    if (!userId || !listId) {
      throw new Error('User ID and List ID are required');
    }

    if (!hotelData || !hotelData.id) {
      throw new Error('Hotel data with ID is required');
    }

    // Check if hotel already exists in list
    const exists = await isHotelInList(userId, listId, hotelData.id);
    if (exists) {
      throw new Error('Hotel already exists in this list');
    }

    const hotelsRef = collection(db, 'users', userId, 'savedLists', listId, 'hotels');
    
    const hotelToAdd = {
      hotelId: hotelData.id,
      name: hotelData.name || 'Unknown Hotel',
      location: hotelData.address || hotelData.location || '',
      rating: hotelData.rating || 0,
      pricePerNight: hotelData.pricePerNight || 0,
      currency: hotelData.currency || 'VND',
      image: hotelData.images?.[0] || hotelData.image || hotelData.thumbnail || null,
      addedAt: Timestamp.now(),
    };

    await addDoc(hotelsRef, hotelToAdd);
    
    // Increment list count
    const listRef = doc(db, 'users', userId, 'savedLists', listId);
    await updateDoc(listRef, {
      count: increment(1),
      updatedAt: Timestamp.now(),
      // Update list image to first hotel image if list has no image
      image: hotelToAdd.image,
    });
  } catch (error) {
    console.error('Error adding hotel to list:', error);
    // Preserve specific error messages for validation and duplicate detection
    if (error.message === 'Hotel already exists in this list' ||
        error.message === 'User ID and List ID are required' ||
        error.message === 'Hotel data with ID is required') {
      throw error;
    }
    throw new Error('Không thể thêm khách sạn vào danh sách. Vui lòng thử lại.');
  }
}

/**
 * Remove hotel from a list
 * @param {string} userId - User ID
 * @param {string} listId - List ID
 * @param {string} hotelId - Hotel ID (document ID in subcollection)
 * @returns {Promise<void>}
 */
export async function removeHotelFromList(userId, listId, hotelId) {
  try {
    if (!userId || !listId || !hotelId) {
      throw new Error('User ID, List ID, and Hotel ID are required');
    }

    const hotelRef = doc(db, 'users', userId, 'savedLists', listId, 'hotels', hotelId);
    await deleteDoc(hotelRef);
    
    // Decrement list count
    const listRef = doc(db, 'users', userId, 'savedLists', listId);
    await updateDoc(listRef, {
      count: increment(-1),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing hotel from list:', error);
    throw new Error('Không thể xóa khách sạn khỏi danh sách. Vui lòng thử lại.');
  }
}

/**
 * Check if hotel is in a list
 * @param {string} userId - User ID
 * @param {string} listId - List ID
 * @param {string} hotelId - Hotel ID (hotelId field, not document ID)
 * @returns {Promise<boolean>}
 */
export async function isHotelInList(userId, listId, hotelId) {
  try {
    if (!userId || !listId || !hotelId) {
      return false;
    }

    const hotelsRef = collection(db, 'users', userId, 'savedLists', listId, 'hotels');
    const q = query(hotelsRef, where('hotelId', '==', hotelId));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if hotel is in list:', error);
    return false;
  }
}

/**
 * Get all lists containing a hotel
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 * @returns {Promise<Array>} Lists containing the hotel
 */
export async function getListsWithHotel(userId, hotelId) {
  try {
    if (!userId || !hotelId) {
      return [];
    }

    const listsRef = collection(db, 'users', userId, 'savedLists');
    const listsSnapshot = await getDocs(listsRef);
    
    const listsWithHotel = [];
    
    for (const listDoc of listsSnapshot.docs) {
      const hasHotel = await isHotelInList(userId, listDoc.id, hotelId);
      if (hasHotel) {
        const listData = listDoc.data();
        listsWithHotel.push({
          id: listDoc.id,
          ...listData,
          createdAt: listData.createdAt?.toDate ? listData.createdAt.toDate() : new Date(listData.createdAt),
          updatedAt: listData.updatedAt?.toDate ? listData.updatedAt.toDate() : new Date(listData.updatedAt),
        });
      }
    }

    return listsWithHotel;
  } catch (error) {
    console.error('Error getting lists with hotel:', error);
    return [];
  }
}

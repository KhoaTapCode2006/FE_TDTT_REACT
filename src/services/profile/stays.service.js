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
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { transformBackendHotel } from '../backend/backend-data.service';

/**
 * Stays Service
 * Handles all stay-related operations with Firestore
 */

/**
 * Fetch all stays for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of stays
 */
export async function fetchStays(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const staysRef = collection(db, 'users', userId, 'stays');
    const staysSnapshot = await getDocs(staysRef);
    
    const stays = [];
    staysSnapshot.forEach((doc) => {
      const data = doc.data();
      stays.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to Date objects
        checkIn: data.checkIn?.toDate ? data.checkIn.toDate() : new Date(data.checkIn),
        checkOut: data.checkOut?.toDate ? data.checkOut.toDate() : new Date(data.checkOut),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      });
    });

    return stays;
  } catch (error) {
    console.error('Error fetching stays:', error);
    throw new Error('Không thể tải danh sách lưu trú. Vui lòng thử lại.');
  }
}

/**
 * Fetch a single stay by ID
 * @param {string} userId - User ID
 * @param {string} stayId - Stay ID
 * @returns {Promise<Object>} Stay object
 */
export async function getStay(userId, stayId) {
  try {
    if (!userId || !stayId) {
      throw new Error('User ID and Stay ID are required');
    }

    const stayRef = doc(db, 'users', userId, 'stays', stayId);
    const stayDoc = await getDoc(stayRef);

    if (!stayDoc.exists()) {
      throw new Error('Stay not found');
    }

    const data = stayDoc.data();
    return {
      id: stayDoc.id,
      ...data,
      checkIn: data.checkIn?.toDate ? data.checkIn.toDate() : new Date(data.checkIn),
      checkOut: data.checkOut?.toDate ? data.checkOut.toDate() : new Date(data.checkOut),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    };
  } catch (error) {
    console.error('Error fetching stay:', error);
    throw new Error('Không thể tải thông tin lưu trú. Vui lòng thử lại.');
  }
}

/**
 * Create a new stay (booking)
 * @param {string} userId - User ID
 * @param {Object} stayData - Stay data
 * @returns {Promise<Object>} Created stay
 */
export async function createStay(userId, stayData) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const staysRef = collection(db, 'users', userId, 'stays');
    
    const now = Timestamp.now();
    const newStay = {
      ...stayData,
      checkIn: stayData.checkIn instanceof Date ? Timestamp.fromDate(stayData.checkIn) : stayData.checkIn,
      checkOut: stayData.checkOut instanceof Date ? Timestamp.fromDate(stayData.checkOut) : stayData.checkOut,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(staysRef, newStay);
    
    return {
      id: docRef.id,
      ...stayData,
      checkIn: stayData.checkIn instanceof Date ? stayData.checkIn : new Date(stayData.checkIn),
      checkOut: stayData.checkOut instanceof Date ? stayData.checkOut : new Date(stayData.checkOut),
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error('Error creating stay:', error);
    throw new Error('Không thể tạo lưu trú. Vui lòng thử lại.');
  }
}

/**
 * Update stay status or review
 * @param {string} userId - User ID
 * @param {string} stayId - Stay ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated stay
 */
export async function updateStay(userId, stayId, updates) {
  try {
    if (!userId || !stayId) {
      throw new Error('User ID and Stay ID are required');
    }

    const stayRef = doc(db, 'users', userId, 'stays', stayId);
    
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(stayRef, updateData);
    
    // Fetch and return updated stay
    return await getStay(userId, stayId);
  } catch (error) {
    console.error('Error updating stay:', error);
    throw new Error('Không thể cập nhật lưu trú. Vui lòng thử lại.');
  }
}

/**
 * Delete a stay
 * @param {string} userId - User ID
 * @param {string} stayId - Stay ID
 * @returns {Promise<void>}
 */
export async function deleteStay(userId, stayId) {
  try {
    if (!userId || !stayId) {
      throw new Error('User ID and Stay ID are required');
    }

    const stayRef = doc(db, 'users', userId, 'stays', stayId);
    await deleteDoc(stayRef);
  } catch (error) {
    console.error('Error deleting stay:', error);
    throw new Error('Không thể xóa lưu trú. Vui lòng thử lại.');
  }
}

/**
 * Filter stays by status
 * @param {Array} stays - Array of stays
 * @param {string} status - Status filter ('all', 'upcoming', 'completed', 'cancelled')
 * @returns {Array} Filtered stays
 */
export function filterByStatus(stays, status) {
  if (!Array.isArray(stays)) return [];
  
  if (status === 'all') {
    return stays;
  }
  
  return stays.filter(stay => stay.status === status);
}

/**
 * Sort stays by date
 * @param {Array} stays - Array of stays
 * @param {string} order - 'asc' or 'desc'
 * @param {string} dateField - 'checkIn' or 'checkOut'
 * @returns {Array} Sorted stays
 */
export function sortByDate(stays, order = 'asc', dateField = 'checkIn') {
  if (!Array.isArray(stays)) return [];
  
  return [...stays].sort((a, b) => {
    const dateA = a[dateField] instanceof Date ? a[dateField] : new Date(a[dateField]);
    const dateB = b[dateField] instanceof Date ? b[dateField] : new Date(b[dateField]);
    
    if (order === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
}

/**
 * Calculate stay duration in nights
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @returns {number} Number of nights
 */
export function calculateDuration(checkIn, checkOut) {
  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn);
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut);
  
  const diffTime = Math.abs(checkOutDate - checkInDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Determine stay status based on dates
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @returns {string} Status ('upcoming', 'completed', 'ongoing')
 */
export function determineStatus(checkIn, checkOut) {
  const now = new Date();
  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn);
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut);
  
  if (now < checkInDate) {
    return 'upcoming';
  } else if (now > checkOutDate) {
    return 'completed';
  } else {
    return 'ongoing';
  }
}

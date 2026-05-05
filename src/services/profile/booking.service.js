import { 
  collection, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Booking Service
 * Handles booking creation and confirmation number generation
 */

/**
 * Generate unique confirmation number
 * Format: BK-YYYYMMDD-XXXXX
 * @returns {string} Confirmation number
 */
function generateConfirmationNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BK-${dateStr}-${random}`;
}

/**
 * Determine booking status based on dates
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @returns {string} Status ('upcoming', 'ongoing', or 'completed')
 */
function determineBookingStatus(checkIn, checkOut) {
  const now = new Date();
  const checkInDate = checkIn instanceof Date ? checkIn : new Date(checkIn);
  const checkOutDate = checkOut instanceof Date ? checkOut : new Date(checkOut);
  
  // Reset time to midnight for accurate date comparison
  now.setHours(0, 0, 0, 0);
  checkInDate.setHours(0, 0, 0, 0);
  checkOutDate.setHours(0, 0, 0, 0);
  
  if (now < checkInDate) {
    return 'upcoming';
  } else if (now > checkOutDate) {
    return 'completed';
  } else {
    return 'ongoing';
  }
}

/**
 * Create a new booking record
 * @param {string} userId - User ID
 * @param {Object} bookingData - Booking information
 * @param {Object} bookingData.hotel - Complete hotel data object
 * @param {Date} bookingData.checkIn - Check-in date
 * @param {Date} bookingData.checkOut - Check-out date
 * @param {number} bookingData.totalPrice - Total booking price
 * @param {Object} [bookingData.guests] - Guest information (optional)
 * @param {number} [bookingData.rooms] - Number of rooms (optional)
 * @returns {Promise<Object>} Created booking
 */
export async function createBooking(userId, bookingData) {
  try {
    // Validate user ID
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Validate required fields
    if (!bookingData) {
      throw new Error('Dữ liệu đặt phòng là bắt buộc');
    }

    if (!bookingData.hotel || !bookingData.hotel.id) {
      throw new Error('Thông tin khách sạn là bắt buộc');
    }

    if (!bookingData.checkIn) {
      throw new Error('Ngày nhận phòng là bắt buộc');
    }

    if (!bookingData.checkOut) {
      throw new Error('Ngày trả phòng là bắt buộc');
    }

    if (!bookingData.totalPrice || bookingData.totalPrice <= 0) {
      throw new Error('Tổng giá phải lớn hơn 0');
    }

    // Convert dates to Date objects if needed
    const checkInDate = bookingData.checkIn instanceof Date 
      ? bookingData.checkIn 
      : new Date(bookingData.checkIn);
    
    const checkOutDate = bookingData.checkOut instanceof Date 
      ? bookingData.checkOut 
      : new Date(bookingData.checkOut);

    // Validate date range
    if (checkOutDate <= checkInDate) {
      throw new Error('Ngày trả phòng phải sau ngày nhận phòng');
    }

    // Generate confirmation number
    const confirmation = generateConfirmationNumber();

    // Determine booking status
    const status = determineBookingStatus(checkInDate, checkOutDate);

    // Prepare stay record
    const now = Timestamp.now();
    const stayRecord = {
      hotelId: bookingData.hotel.id,
      hotelName: bookingData.hotel.name || 'Unknown Hotel',
      location: bookingData.hotel.address || bookingData.hotel.location || '',
      checkIn: Timestamp.fromDate(checkInDate),
      checkOut: Timestamp.fromDate(checkOutDate),
      price: bookingData.totalPrice,
      currency: bookingData.hotel.currency || 'VND',
      rating: bookingData.hotel.rating || 0,
      image: bookingData.hotel.images?.[0] || bookingData.hotel.image || null,
      status: status,
      confirmation: confirmation,
      // Store complete hotel snapshot for future reference
      hotelData: {
        id: bookingData.hotel.id,
        name: bookingData.hotel.name,
        address: bookingData.hotel.address || bookingData.hotel.location,
        rating: bookingData.hotel.rating,
        pricePerNight: bookingData.hotel.pricePerNight,
        currency: bookingData.hotel.currency || 'VND',
        images: bookingData.hotel.images || [],
        amenities: bookingData.hotel.amenities || [],
        description: bookingData.hotel.description || '',
        reviews: bookingData.hotel.reviews || [],
        nearbyLandmarks: bookingData.hotel.nearbyLandmarks || [],
        ai_score: bookingData.hotel.ai_score,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields if provided
    if (bookingData.guests) {
      stayRecord.guests = bookingData.guests;
    }

    if (bookingData.rooms) {
      stayRecord.rooms = bookingData.rooms;
    }

    // Create stay record in Firestore
    const staysRef = collection(db, 'users', userId, 'stays');
    const docRef = await addDoc(staysRef, stayRecord);

    // Return created booking with converted dates
    return {
      id: docRef.id,
      hotelId: stayRecord.hotelId,
      hotelName: stayRecord.hotelName,
      location: stayRecord.location,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      price: stayRecord.price,
      currency: stayRecord.currency,
      rating: stayRecord.rating,
      image: stayRecord.image,
      status: stayRecord.status,
      confirmation: stayRecord.confirmation,
      hotelData: stayRecord.hotelData,
      guests: stayRecord.guests,
      rooms: stayRecord.rooms,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Re-throw validation errors with original message
    if (error.message.includes('bắt buộc') || 
        error.message.includes('phải') ||
        error.message === 'User ID is required') {
      throw error;
    }
    
    // Map Firebase errors to user-friendly messages
    if (error.code === 'permission-denied') {
      throw new Error('Bạn không có quyền thực hiện thao tác này');
    } else if (error.code === 'unavailable') {
      throw new Error('Không thể kết nối. Vui lòng kiểm tra kết nối mạng');
    } else {
      throw new Error('Không thể tạo đặt phòng. Vui lòng thử lại');
    }
  }
}

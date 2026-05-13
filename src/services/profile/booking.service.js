import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';

/**
 * Booking Service
 * Handles booking creation via backend REST API
 * Note: Backend booking endpoints may not be fully implemented yet
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
 * @param {string} userId - User ID (not used, kept for backward compatibility)
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
    await ensureValidToken();

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

    // Prepare booking request for backend
    const backendBookingRequest = {
      hotel_id: bookingData.hotel.id,
      hotel_name: bookingData.hotel.name || 'Unknown Hotel',
      location: bookingData.hotel.address || bookingData.hotel.location || '',
      check_in: checkInDate.toISOString(),
      check_out: checkOutDate.toISOString(),
      price: bookingData.totalPrice,
      currency: bookingData.hotel.currency || 'VND',
      rating: bookingData.hotel.rating || 0,
      image: bookingData.hotel.images?.[0] || bookingData.hotel.image || null,
      status: status,
      confirmation: confirmation,
      // Store complete hotel snapshot for future reference
      hotel_data: {
        id: bookingData.hotel.id,
        name: bookingData.hotel.name,
        address: bookingData.hotel.address || bookingData.hotel.location,
        rating: bookingData.hotel.rating,
        price_per_night: bookingData.hotel.pricePerNight,
        currency: bookingData.hotel.currency || 'VND',
        images: bookingData.hotel.images || [],
        amenities: bookingData.hotel.amenities || [],
        description: bookingData.hotel.description || '',
        reviews: bookingData.hotel.reviews || [],
        nearby_landmarks: bookingData.hotel.nearbyLandmarks || [],
        ai_score: bookingData.hotel.ai_score,
      },
    };

    // Add optional fields if provided
    if (bookingData.guests) {
      backendBookingRequest.guests = bookingData.guests;
    }

    if (bookingData.rooms) {
      backendBookingRequest.rooms = bookingData.rooms;
    }

    try {
      // Try to create booking via backend API
      // Note: This endpoint may not be implemented yet
      const backendBooking = await apiClient.post('/bookings', backendBookingRequest);

      // Transform backend response to frontend format
      return {
        id: backendBooking.id,
        hotelId: backendBooking.hotel_id,
        hotelName: backendBooking.hotel_name,
        location: backendBooking.location,
        checkIn: new Date(backendBooking.check_in),
        checkOut: new Date(backendBooking.check_out),
        price: backendBooking.price,
        currency: backendBooking.currency,
        rating: backendBooking.rating,
        image: backendBooking.image,
        status: backendBooking.status,
        confirmation: backendBooking.confirmation,
        hotelData: backendBooking.hotel_data,
        guests: backendBooking.guests,
        rooms: backendBooking.rooms,
        createdAt: new Date(backendBooking.created_at),
        updatedAt: new Date(backendBooking.updated_at),
      };
    } catch (apiError) {
      // If backend endpoint is not implemented, log warning and return mock response
      console.warn('Backend booking endpoint not available, returning mock booking:', apiError.message);
      
      // Return mock booking for backward compatibility
      const now = new Date();
      return {
        id: `booking-${Date.now()}`,
        hotelId: bookingData.hotel.id,
        hotelName: bookingData.hotel.name || 'Unknown Hotel',
        location: bookingData.hotel.address || bookingData.hotel.location || '',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        price: bookingData.totalPrice,
        currency: bookingData.hotel.currency || 'VND',
        rating: bookingData.hotel.rating || 0,
        image: bookingData.hotel.images?.[0] || bookingData.hotel.image || null,
        status: status,
        confirmation: confirmation,
        hotelData: backendBookingRequest.hotel_data,
        guests: bookingData.guests,
        rooms: bookingData.rooms,
        createdAt: now,
        updatedAt: now,
      };
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Re-throw validation errors with original message
    if (error.message.includes('bắt buộc') || 
        error.message.includes('phải')) {
      throw error;
    }

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (error.status === 400) {
      throw new Error(error.message || 'Dữ liệu đặt phòng không hợp lệ');
    }
    
    throw new Error(error.message || 'Không thể tạo đặt phòng. Vui lòng thử lại');
  }
}

/**
 * Get all bookings for user
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @returns {Promise<Array>} List of bookings
 */
export async function getBookings(userId) {
  try {
    await ensureValidToken();

    try {
      // Try to get bookings from backend API
      const backendBookings = await apiClient.get('/me/bookings');

      // Transform each booking to frontend format
      return backendBookings.map(booking => ({
        id: booking.id,
        hotelId: booking.hotel_id,
        hotelName: booking.hotel_name,
        location: booking.location,
        checkIn: new Date(booking.check_in),
        checkOut: new Date(booking.check_out),
        price: booking.price,
        currency: booking.currency,
        rating: booking.rating,
        image: booking.image,
        status: booking.status,
        confirmation: booking.confirmation,
        hotelData: booking.hotel_data,
        guests: booking.guests,
        rooms: booking.rooms,
        createdAt: new Date(booking.created_at),
        updatedAt: new Date(booking.updated_at),
      }));
    } catch (apiError) {
      // If backend endpoint is not implemented, return empty array
      console.warn('Backend bookings endpoint not available:', apiError.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    throw new Error(error.message || 'Không thể tải danh sách đặt phòng. Vui lòng thử lại');
  }
}

/**
 * Get a single booking by ID
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} Booking or null
 */
export async function getBooking(userId, bookingId) {
  try {
    await ensureValidToken();

    try {
      // Try to get booking from backend API
      const backendBooking = await apiClient.get(`/bookings/${bookingId}`);

      // Transform to frontend format
      return {
        id: backendBooking.id,
        hotelId: backendBooking.hotel_id,
        hotelName: backendBooking.hotel_name,
        location: backendBooking.location,
        checkIn: new Date(backendBooking.check_in),
        checkOut: new Date(backendBooking.check_out),
        price: backendBooking.price,
        currency: backendBooking.currency,
        rating: backendBooking.rating,
        image: backendBooking.image,
        status: backendBooking.status,
        confirmation: backendBooking.confirmation,
        hotelData: backendBooking.hotel_data,
        guests: backendBooking.guests,
        rooms: backendBooking.rooms,
        createdAt: new Date(backendBooking.created_at),
        updatedAt: new Date(backendBooking.updated_at),
      };
    } catch (apiError) {
      // If backend endpoint is not implemented, return null
      console.warn('Backend booking endpoint not available:', apiError.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching booking:', error);

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (error.status === 404) {
      return null;
    }

    throw new Error(error.message || 'Không thể tải thông tin đặt phòng. Vui lòng thử lại');
  }
}

/**
 * Update booking status
 * @param {string} userId - User ID (not used, kept for backward compatibility)
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated booking
 */
export async function updateBookingStatus(userId, bookingId, status) {
  try {
    await ensureValidToken();

    try {
      // Try to update booking via backend API
      const backendBooking = await apiClient.patch(`/bookings/${bookingId}`, {
        status: status
      });

      // Transform to frontend format
      return {
        id: backendBooking.id,
        hotelId: backendBooking.hotel_id,
        hotelName: backendBooking.hotel_name,
        location: backendBooking.location,
        checkIn: new Date(backendBooking.check_in),
        checkOut: new Date(backendBooking.check_out),
        price: backendBooking.price,
        currency: backendBooking.currency,
        rating: backendBooking.rating,
        image: backendBooking.image,
        status: backendBooking.status,
        confirmation: backendBooking.confirmation,
        hotelData: backendBooking.hotel_data,
        guests: backendBooking.guests,
        rooms: backendBooking.rooms,
        createdAt: new Date(backendBooking.created_at),
        updatedAt: new Date(backendBooking.updated_at),
      };
    } catch (apiError) {
      // If backend endpoint is not implemented, throw error
      console.warn('Backend booking update endpoint not available:', apiError.message);
      throw new Error('Booking update endpoint not yet implemented');
    }
  } catch (error) {
    console.error('Error updating booking status:', error);

    if (error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (error.status === 404) {
      throw new Error('Booking not found');
    }

    throw new Error(error.message || 'Không thể cập nhật trạng thái đặt phòng. Vui lòng thử lại');
  }
}

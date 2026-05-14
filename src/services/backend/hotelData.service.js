/**
 * Hotel Data Service
 * 
 * Service for loading and transforming mock hotel data from sample_output_2.json.
 * Provides methods to fetch, transform, and validate hotel data for frontend use.
 * 
 * Requirements: 3.1, 3.2, 3.6, 3.7
 */

/**
 * Load mock hotels from sample_output_2.json
 * 
 * Fetches the JSON file from the public directory and transforms the data
 * to the frontend hotel schema. Handles errors gracefully by returning an
 * empty array on critical failures.
 * 
 * @returns {Promise<Array>} Array of transformed hotel objects
 */
export async function loadMockHotels() {
  try {
    // Fetch JSON file from public directory
    const response = await fetch('/sample_output_2.json');
    
    if (!response.ok) {
      console.error(`Failed to load mock data: HTTP ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid mock data format: data is not an object');
      return [];
    }
    
    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid mock data format: data.data is not an array');
      return [];
    }
    
    // Transform and validate each hotel
    const hotels = data.data
      .map((backendHotel, index) => transformHotel(backendHotel, index))
      .filter(hotel => validateHotelData(hotel));
    
    console.log(`Loaded ${hotels.length} valid hotels from ${data.data.length} total entries`);
    
    return hotels;
  } catch (error) {
    // Handle parse errors, network errors, etc.
    console.error('Error loading mock hotels:', error);
    
    // Return empty array on critical errors
    return [];
  }
}

/**
 * Transform backend hotel schema to frontend schema
 * 
 * Maps backend fields to frontend format:
 * - property_token → id
 * - gps_coordinates → coordinates with latitude and longitude
 * - ai_score → rating
 * - images array with thumbnail and original_image → original
 * 
 * Handles missing optional fields with defaults.
 * 
 * @param {Object} backendHotel - Backend hotel data (snake_case)
 * @param {number} index - Index in the array (for fallback ID generation)
 * @returns {Object} Frontend hotel data (camelCase)
 */
export function transformHotel(backendHotel, index = 0) {
  if (!backendHotel || typeof backendHotel !== 'object') {
    console.warn('Invalid hotel data: not an object');
    return null;
  }
  
  // Extract fields from backend schema
  const {
    property_token,
    name,
    description,
    address,
    phone,
    gps_coordinates,
    price,
    ai_score,
    images,
    amenities,
    link
  } = backendHotel;
  
  // Transform to frontend schema
  return {
    // Map property_token to id, with fallback for missing tokens
    id: property_token || `hotel-fallback-${Date.now()}-${index}`,
    
    // Required fields with defaults
    name: name || 'Unknown Hotel',
    
    // Map gps_coordinates to coordinates with latitude and longitude
    coordinates: {
      latitude: gps_coordinates?.latitude || 0,
      longitude: gps_coordinates?.longitude || 0
    },
    
    // IMPORTANT: Also add lat/lng for VietMap compatibility
    lat: gps_coordinates?.latitude || 0,
    lng: gps_coordinates?.longitude || 0,
    
    // Map ai_score to rating - generate random rating if ai_score is 0 or missing
    rating: (ai_score && ai_score > 0) ? ai_score : (3.5 + Math.random() * 1.5), // Random rating between 3.5 and 5.0
    
    // Optional fields with null/default values
    description: description || null,
    address: address || null,
    phone: phone || null,
    price: price || 0,
    pricePerNight: price || 0, // Add pricePerNight alias for compatibility
    link: link || null,
    
    // Transform images array: thumbnail and original_image → original
    images: (images || []).map(img => img?.thumbnail || ''),
    thumbnail: images?.[0]?.thumbnail || '', // Add thumbnail field for marker
    
    // Amenities array with default empty array
    amenities: amenities || []
  };
}

/**
 * Validate hotel data to check required fields
 * 
 * Ensures that the hotel has:
 * - id (string)
 * - name (string)
 * - coordinates with valid latitude and longitude
 * - lat/lng fields for VietMap compatibility
 * 
 * @param {Object} hotel - Transformed hotel object
 * @returns {boolean} True if hotel data is valid, false otherwise
 */
export function validateHotelData(hotel) {
  if (!hotel || typeof hotel !== 'object') {
    console.warn('Validation failed: hotel is not an object');
    return false;
  }
  
  // Check required field: id
  if (!hotel.id || typeof hotel.id !== 'string') {
    console.warn('Validation failed: missing or invalid id');
    return false;
  }
  
  // Check required field: name
  if (!hotel.name || typeof hotel.name !== 'string') {
    console.warn('Validation failed: missing or invalid name');
    return false;
  }
  
  // Check required field: lat (for VietMap)
  if (typeof hotel.lat !== 'number' || 
      isNaN(hotel.lat) ||
      hotel.lat === 0) {
    console.warn(`Validation failed for hotel ${hotel.id}: invalid lat`);
    return false;
  }
  
  // Check required field: lng (for VietMap)
  if (typeof hotel.lng !== 'number' || 
      isNaN(hotel.lng) ||
      hotel.lng === 0) {
    console.warn(`Validation failed for hotel ${hotel.id}: invalid lng`);
    return false;
  }
  
  return true;
}

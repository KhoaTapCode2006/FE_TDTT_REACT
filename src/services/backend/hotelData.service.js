/**
 * Hotel Data Service
 * 
 * Service for loading and transforming mock hotel data from sample_output_2.json.
 * Provides methods to fetch, transform, and validate hotel data for frontend use.
 * 
 * Requirements: 3.1, 3.2, 3.6, 3.7
 */

import { transformHotelDetailResponse } from '../../utils/schemaTransformers.js';
import { normalizeHotelResult } from '../../utils/format.js';

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
    
    // Transform and validate each hotel using the new transformer
    const hotels = data.data
      .map((backendHotel, index) => {
        try {
          return transformHotelDetailResponse(backendHotel, index);
        } catch (error) {
          console.error(`Failed to transform hotel at index ${index}:`, error);
          return null;
        }
      })
      .filter(hotel => hotel !== null && validateHotelData(hotel));
    
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

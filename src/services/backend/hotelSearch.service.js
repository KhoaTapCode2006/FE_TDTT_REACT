/**
 * Hotel Search Service
 * 
 * Service for interacting with the Discover API for hotel search operations.
 * Provides methods to get address suggestions, search hotels, and retrieve hotel details.
 * 
 * Requirements: 13.2, 13.3, 13.5, 13.7, 13.8
 */

import { apiClient } from '../api/apiClient.js';

/**
 * Hotel Search Service Class
 * 
 * Handles all hotel search-related API calls including:
 * - Address suggestions
 * - Hotel search with filters
 * - Hotel detail retrieval
 */
class HotelSearchService {
  /**
   * Get address suggestions based on user input
   * 
   * Calls the /discover/address-suggest endpoint to get address suggestions
   * with ref_id for use in hotel search.
   * 
   * @param {string} address - Address query string
   * @returns {Promise<Array>} Array of address suggestions with ref_id
   * @throws {Error} If API call fails
   * 
   * Requirements: 13.2, 13.3
   */
  async getAddressSuggestions(address) {
    try {
      if (!address || typeof address !== 'string' || address.trim().length === 0) {
        return [];
      }

      // Use POST method as backend requires it
      const response = await apiClient.post('/discover/address-suggest', { 
        query: address.trim() 
      });
      
      // Backend returns {suggestions: [...]}
      let suggestions = response;
      
      // Check for suggestions property first (actual backend format)
      if (response && typeof response === 'object' && response.suggestions) {
        suggestions = response.suggestions;
      }
      // Fallback: check for data property
      else if (response && typeof response === 'object' && response.data) {
        suggestions = response.data;
      }
      
      // Response should be an array of suggestions
      if (!Array.isArray(suggestions)) {
        console.warn('Address suggestions is not an array:', suggestions);
        return [];
      }

      const mapped = suggestions.map(suggestion => ({
        ref_id: suggestion.ref_id || suggestion.refId || '',
        display: suggestion.display || suggestion.name || suggestion.address || address,
        address: suggestion.address || address
      }));
      
      console.log('✅ Mapped suggestions:', mapped);
      return mapped;
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      
      // Handle specific error codes
      if (error.status === 405) {
        console.error('Method not allowed for address-suggest API. Backend may require POST instead of GET.');
      } else if (error.status === 400) {
        console.error('Bad request for address-suggest API. Check query parameter format.');
      } else if (error.status === 500) {
        console.error('Server error for address-suggest API.');
      }
      
      // Return empty array on error to allow graceful degradation
      return [];
    }
  }

  /**
   * Search for hotels with specified criteria
   * 
   * Calls the /discover endpoint with search parameters including:
   * - address, gps coordinates, ref_id
   * - check-in/check-out dates
   * - number of adults and children
   * - personality (user requirements)
   * - trip_style, trip_criteria, max_ranked_hotels
   * 
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.address - Address string
   * @param {Object} searchParams.gps - GPS coordinates {latitude, longitude, geohash}
   * @param {string} searchParams.ref_id - Reference ID from address suggestion
   * @param {string} searchParams.check_in - Check-in date (ISO format)
   * @param {string} searchParams.check_out - Check-out date (ISO format)
   * @param {Array<number>} searchParams.children - Array of children ages
   * @param {number} searchParams.adults - Number of adults
   * @param {string} searchParams.personality - User requirements/preferences
   * @param {string|null} searchParams.trip_style - Trip style preference
   * @param {Object|null} searchParams.trip_criteria - Trip criteria object
   * @param {number} searchParams.max_ranked_hotels - Maximum number of hotels to return
   * @returns {Promise<Array>} Array of hotel search results with hotel_id, latitude, longitude
   * @throws {Error} If API call fails
   * 
   * Requirements: 13.5, 13.7
   */
  async searchHotels(searchParams) {
    try {
      // Validate required parameters
      if (!searchParams || typeof searchParams !== 'object') {
        throw new Error('Search parameters are required');
      }

      const {
        address,
        gps,
        ref_id,
        check_in,
        check_out,
        children = [],
        adults = 2,
        personality = '',
        trip_style = null,
        trip_criteria = null,
        max_ranked_hotels = 50
      } = searchParams;

      // Validate required fields
      if (!address) {
        throw new Error('Address is required');
      }

      if (!gps || !gps.latitude || !gps.longitude) {
        throw new Error('GPS coordinates are required');
      }

      if (!check_in || !check_out) {
        throw new Error('Check-in and check-out dates are required');
      }

      // Prepare request body
      const requestBody = {
        address,
        gps: {
          latitude: gps.latitude,
          longitude: gps.longitude,
          geohash: gps.geohash || ''
        },
        ref_id: ref_id || '',
        check_in,
        check_out,
        children: Array.isArray(children) ? children : [],
        adults,
        personality,
        trip_style,
        trip_criteria,
        max_ranked_hotels
      };

      const response = await apiClient.post('/discover', requestBody);
      
      // Response should be an array of hotel results
      if (!Array.isArray(response)) {
        console.warn('Hotel search response is not an array:', response);
        return [];
      }

      return response.map(hotel => ({
        hotel_id: hotel.hotel_id || hotel.hotelId || hotel.id,
        latitude: hotel.latitude || hotel.lat || 0,
        longitude: hotel.longitude || hotel.lng || hotel.lon || 0,
        // Include any additional fields from response
        ...hotel
      }));
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific hotel
   * 
   * Calls the /discover/hotels/{hotel_id} endpoint to retrieve
   * complete hotel information including images, amenities, pricing, etc.
   * 
   * Response format from API:
   * {
   *   property_token, name, description, link, address, phone,
   *   gps_coordinates: {latitude, longitude, geohash},
   *   nearby_places, distance, check_in_time, check_out_time,
   *   price, deal, booking_sources, images, amenities,
   *   raw_rating, user_reviews,
   *   ai_sentiment: {ai_score, ai_score_expiration_date, trust_weight, analyzed_reviews},
   *   ai_summary: {ai_summary_expiration_date, overview, pros, cons, notes},
   *   last_updated, views: {total_views, weekly_views}
   * }
   * 
   * @param {string} hotelId - Hotel ID
   * @returns {Promise<Object>} Hotel details object transformed to frontend format
   * @throws {Error} If API call fails or hotel not found
   * 
   * Requirements: 13.8
   */
  async getHotelDetails(hotelId) {
    try {
      if (!hotelId || typeof hotelId !== 'string') {
        throw new Error('Hotel ID is required');
      }

      const response = await apiClient.get(`/discover/hotels/${encodeURIComponent(hotelId)}`);
      
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid hotel details response');
      }

      // Extract data from response (API returns {status_code, message, data})
      const data = response.data || response;

      // Transform response to frontend format matching HotelCard expectations
      return {
        // Basic Info
        id: data.property_token || data.id || hotelId,
        propertyToken: data.property_token || hotelId,
        name: data.name || 'Unknown Hotel',
        description: data.description || null,
        address: data.address || null,
        location: data.address || null, // Alias for address
        phone: data.phone || null,
        link: data.link || null,
        
        // GPS Coordinates
        coordinates: {
          latitude: data.gps_coordinates?.latitude || 0,
          longitude: data.gps_coordinates?.longitude || 0,
          geohash: data.gps_coordinates?.geohash || ''
        },
        lat: data.gps_coordinates?.latitude || 0,
        lng: data.gps_coordinates?.longitude || 0,
        
        // Pricing
        price: data.price || 0,
        pricePerNight: data.price || 0,
        deal: data.deal || null,
        currency: 'VND',
        
        // Ratings - Use ai_score from ai_sentiment
        rating: data.ai_sentiment?.ai_score || data.raw_rating || 0,
        rawRating: data.raw_rating || 0,
        ai_score: data.ai_sentiment?.ai_score || 0,
        trustWeight: data.ai_sentiment?.trust_weight || 0,
        
        // Images - Transform to frontend format
        images: Array.isArray(data.images) ? data.images.map(img => {
          if (typeof img === 'string') {
            return { thumbnail: img, original: img };
          }
          return {
            thumbnail: img?.thumbnail || img?.url || '',
            original: img?.original_image || img?.original || img?.url || img?.thumbnail || ''
          };
        }) : [],
        thumbnail: Array.isArray(data.images) && data.images.length > 0 
          ? (typeof data.images[0] === 'string' ? data.images[0] : data.images[0]?.thumbnail || data.images[0]?.url || '')
          : null,
        
        // Amenities
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        
        // Reviews
        userReviews: Array.isArray(data.user_reviews) ? data.user_reviews : [],
        analyzedReviews: Array.isArray(data.ai_sentiment?.analyzed_reviews) ? data.ai_sentiment.analyzed_reviews : [],
        
        // AI Summary
        aiSummary: data.ai_summary ? {
          overview: data.ai_summary.overview || '',
          pros: Array.isArray(data.ai_summary.pros) ? data.ai_summary.pros : [],
          cons: Array.isArray(data.ai_summary.cons) ? data.ai_summary.cons : [],
          notes: data.ai_summary.notes || ''
        } : null,
        
        // Additional Info
        nearbyPlaces: Array.isArray(data.nearby_places) ? data.nearby_places : [],
        distance: data.distance || 0,
        checkInTime: data.check_in_time || null,
        checkOutTime: data.check_out_time || null,
        bookingSources: Array.isArray(data.booking_sources) ? data.booking_sources : [],
        
        // Metadata
        lastUpdated: data.last_updated || null,
        views: data.views ? {
          total: data.views.total_views || 0,
          weekly: data.views.weekly_views || 0
        } : { total: 0, weekly: 0 }
      };
    } catch (error) {
      console.error(`Error fetching hotel details for ${hotelId}:`, error);
      throw error;
    }
  }

  /**
   * Batch fetch hotel details for multiple hotels
   * 
   * Fetches details for multiple hotels in parallel with error handling.
   * Failed requests are logged but don't stop the entire batch.
   * 
   * @param {Array<string>} hotelIds - Array of hotel IDs
   * @returns {Promise<Array>} Array of hotel details (excluding failed requests)
   */
  async getMultipleHotelDetails(hotelIds) {
    try {
      if (!Array.isArray(hotelIds) || hotelIds.length === 0) {
        return [];
      }

      // Fetch all hotel details in parallel
      const promises = hotelIds.map(hotelId => 
        this.getHotelDetails(hotelId).catch(error => {
          console.error(`Failed to fetch details for hotel ${hotelId}:`, error);
          return null; // Return null for failed requests
        })
      );

      const results = await Promise.all(promises);
      
      // Filter out null results (failed requests)
      return results.filter(hotel => hotel !== null);
    } catch (error) {
      console.error('Error fetching multiple hotel details:', error);
      return [];
    }
  }
}

// Export singleton instance
export const hotelSearchService = new HotelSearchService();
export default hotelSearchService;

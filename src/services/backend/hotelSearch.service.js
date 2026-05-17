/**
 * Hotel Search Service
 * 
 * Service for interacting with the Discover API for hotel search operations.
 * Provides methods to get address suggestions, search hotels, and retrieve hotel details.
 * 
 * Requirements: 13.2, 13.3, 13.5, 13.7, 13.8
 */
import { geolocationService } from '../geolocation.service.js';
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
   * @param {Object} userGps
   * @param {AbortSignal} signal - Signal dùng để hủy request khi gõ nhanh (chống nghẽn/timeout)
   * @returns {Promise<Array>} Array of address suggestions with ref_id
   * @throws {Error} If API call fails
   * 
   * Requirements: 13.2, 13.3
   */
  async getAddressSuggestions(address, userGps = null, signal = null) {
    try {
      if (!address || typeof address !== 'string' || address.trim().length === 0) {
        return [];
      }

      let userLocation = null;

      try {
        console.log("HotelSearchService: Đang lấy GPS người dùng qua geolocationService...");
        userLocation = await geolocationService.requestUserLocation();
      } catch (geoError) {
        console.warn("Không thể lấy user location qua service, fallback về mặc định:", geoError);
        userLocation = geolocationService.getDefaultLocation();
      }

      // 3. ĐÓNG GÓI PAYLOAD: Ép kiểu Number để chắc chắn Backend Python/Pydantic không lỗi
      const requestBody = {
        query: address.trim(),
        gps: {
          latitude: userLocation && userLocation.latitude ? Number(userLocation.latitude) : 0,
          longitude: userLocation && userLocation.longitude ? Number(userLocation.longitude) : 0,
          geohash: userLocation && userLocation.geohash ? userLocation.geohash : ""
        }
      };
      // Use POST method as backend requires it
      const response = await apiClient.post('/discover/address-suggest', requestBody, { signal });
      
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
   * 
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.address - Address string
   * @param {Object} searchParams.gps - GPS coordinates {latitude, longitude, geohash}
   * @param {string} searchParams.ref_id - Reference ID from address suggestion
   * @param {string} searchParams.check_in - Check-in date (YYYY-MM-DD format)
   * @param {string} searchParams.check_out - Check-out date (YYYY-MM-DD format)
   * @param {Array<number>} searchParams.children - Array of children ages
   * @param {number} searchParams.adults - Number of adults
   * @param {string} searchParams.personality - User requirements/preferences
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
        personality = ''
      } = searchParams;

      // Validate required fields
      if (!address) {
        throw new Error('Address is required');
      }

      // GPS validation with fallback to default values (Requirement 8.7)
      const gpsData = {
        latitude: gps?.latitude || 0,
        longitude: gps?.longitude || 0,
        geohash: gps?.geohash || ''
      };

      if (!check_in || !check_out) {
        throw new Error('Check-in and check-out dates are required');
      }

      const requestBody = {
        address,
        gps: gpsData,
        ref_id: ref_id || '',
        check_in,
        check_out,
        children: Array.isArray(children) ? children : [],
        adults,
        personality,
      };

      const response = await apiClient.post('/discover', requestBody);
      
      // Extract hotels array from response
      let hotelsArray = [];
      
      if (Array.isArray(response)) {
        // Response is already an array
        hotelsArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        // Response has a data property containing the array
        hotelsArray = response.data;
      } else {
        console.warn('Hotel search response is not an array and has no data property:', response);
        return [];
      }

      // Amenity normalization mapping - maps backend amenity strings to frontend constants
      const normalizeAmenity = (amenity) => {
        if (!amenity || typeof amenity !== 'string') return null;
        
        const normalized = amenity.toLowerCase().trim();
        
        // Direct matches
        if (normalized === 'wifi' || normalized === 'wi-fi') return 'wifi';
        if (normalized === 'pool' || normalized === 'hồ bơi' || normalized === 'bể bơi' || normalized === 'swimming pool') return 'pool';
        if (normalized === 'gym' || normalized === 'fitness center' || normalized === 'fitness_center' || normalized === 'phòng gym') return 'fitness_center';
        if (normalized === 'spa') return 'spa';
        if (normalized === 'restaurant' || normalized === 'nhà hàng') return 'restaurant';
        if (normalized === 'bar' || normalized === 'quầy bar') return 'bar';
        if (normalized === 'breakfast' || normalized === 'ăn sáng' || normalized === 'free breakfast') return 'breakfast';
        if (normalized === 'parking' || normalized === 'đỗ xe' || normalized === 'bãi đỗ xe') return 'parking';
        if (normalized === 'ac' || normalized === 'air conditioning' || normalized === 'điều hòa' || normalized === 'máy lạnh') return 'ac';
        if (normalized === 'pet friendly' || normalized === 'pet_friendly' || normalized === 'thú cưng') return 'pet_friendly';
        if (normalized === 'laundry' || normalized === 'giặt ủi') return 'laundry';
        if (normalized === 'shuttle' || normalized === 'airport shuttle' || normalized === 'đưa đón') return 'shuttle';
        if (normalized === 'kitchen' || normalized === 'bếp') return 'kitchen';
        
        // Partial matches
        if (normalized.includes('wifi') || normalized.includes('wi-fi')) return 'wifi';
        if (normalized.includes('pool') || normalized.includes('hồ bơi') || normalized.includes('bể bơi')) return 'pool';
        if (normalized.includes('gym') || normalized.includes('fitness')) return 'fitness_center';
        if (normalized.includes('spa')) return 'spa';
        if (normalized.includes('restaurant') || normalized.includes('nhà hàng')) return 'restaurant';
        if (normalized.includes('bar') || normalized.includes('quầy bar')) return 'bar';
        if (normalized.includes('breakfast') || normalized.includes('ăn sáng')) return 'breakfast';
        if (normalized.includes('parking') || normalized.includes('đỗ xe')) return 'parking';
        if (normalized.includes('air conditioning') || normalized.includes('điều hòa') || normalized.includes('ac')) return 'ac';
        if (normalized.includes('pet') || normalized.includes('thú cưng')) return 'pet_friendly';
        if (normalized.includes('laundry') || normalized.includes('giặt')) return 'laundry';
        if (normalized.includes('shuttle') || normalized.includes('đưa đón')) return 'shuttle';
        if (normalized.includes('kitchen') || normalized.includes('bếp')) return 'kitchen';
        
        // If no match found, return null to filter out
        return null;
      };

      // Transform hotels to match HotelCard expected format
      return hotelsArray.map(hotel => {
        // Extract GPS coordinates with proper fallbacks
        const gpsLat = hotel.gps_coordinates?.latitude || hotel.latitude || null;
        const gpsLng = hotel.gps_coordinates?.longitude || hotel.longitude || null;
        
        // Extract images - store both thumbnail and original for fallback
        const images = Array.isArray(hotel.images) ? hotel.images.map(img => {
          // Handle string URLs
          if (typeof img === 'string') {
            return { url: img, thumbnail: img, original: img };
          }
          // Handle image objects - keep both thumbnail and original
          return {
            url: img.original_image || img.original || img.url || img.thumbnail || '',
            thumbnail: img.thumbnail || img.url || '',
            original: img.original_image || img.original || img.url || img.thumbnail || ''
          };
        }).filter(img => img.url) : [];
        
        // Normalize amenities to match frontend constants
        const normalizedAmenities = Array.isArray(hotel.amenities) 
          ? hotel.amenities
              .map(normalizeAmenity)
              .filter(Boolean) // Remove nulls
              .filter((amenity, index, self) => self.indexOf(amenity) === index) // Remove duplicates
          : [];

        return {
          // IDs
          id: hotel.property_token || hotel.hotel_id || hotel.hotelId || hotel.id,
          propertyToken: hotel.property_token,
          hotel_id: hotel.property_token,
          
          // Basic info
          name: hotel.name || 'Unknown Hotel',
          description: hotel.description || null,
          address: hotel.address || null,
          location: hotel.address || null,
          phone: hotel.phone || null,
          link: hotel.link || null,
          
          // GPS - use null instead of 0 for invalid coordinates
          latitude: gpsLat,
          longitude: gpsLng,
          lat: gpsLat,
          lng: gpsLng,
          coordinates: {
            latitude: gpsLat || 0,
            longitude: gpsLng || 0,
            geohash: hotel.gps_coordinates?.geohash || ''
          },
          
          // Pricing
          price: hotel.price || 0,
          pricePerNight: hotel.price || 0,
          deal: hotel.deal || null,
          currency: 'VND',
          
          // Rating - use ai_score from ai_sentiment
          rating: hotel.ai_sentiment?.ai_score || hotel.raw_rating || 0,
          rawRating: hotel.raw_rating || 0,
          ai_score: hotel.ai_sentiment?.ai_score || 0,
          trustWeight: hotel.ai_sentiment?.trust_weight || 0,
          
          // AI Sentiment (for popup display)
          aiSentiment: hotel.ai_sentiment ? {
            aiScore: hotel.ai_sentiment.ai_score || 0,
            trustWeight: hotel.ai_sentiment.trust_weight || 0,
            analyzedReviews: hotel.ai_sentiment.analyzed_reviews?.length || 0
          } : null,
          
          // Images - store as objects with both thumbnail and original for fallback
          images: images,
          thumbnail: images.length > 0 ? images[0].thumbnail : null,
          
          // Amenities - normalized to match frontend constants
          amenities: normalizedAmenities,
          
          // Reviews - map to both userReviews AND reviews for compatibility
          userReviews: Array.isArray(hotel.user_reviews) ? hotel.user_reviews : [],
          reviews: Array.isArray(hotel.user_reviews) ? hotel.user_reviews : [],
          analyzedReviews: Array.isArray(hotel.ai_sentiment?.analyzed_reviews) ? hotel.ai_sentiment.analyzed_reviews : [],
          
          // AI Summary
          aiSummary: hotel.ai_summary ? {
            overview: hotel.ai_summary.overview || '',
            pros: Array.isArray(hotel.ai_summary.pros) ? hotel.ai_summary.pros : [],
            cons: Array.isArray(hotel.ai_summary.cons) ? hotel.ai_summary.cons : [],
            notes: hotel.ai_summary.notes || ''
          } : null,
          
          // Additional info
          nearbyPlaces: Array.isArray(hotel.nearby_places) ? hotel.nearby_places : [],
          nearbyLandmarks: Array.isArray(hotel.nearby_places) ? hotel.nearby_places.map(place => ({
            name: place.name || place,
            distance: place.distance || 'N/A'
          })) : [],
          distance: hotel.distance || 0,
          checkInTime: hotel.check_in_time || null,
          checkOutTime: hotel.check_out_time || null,
          bookingSources: Array.isArray(hotel.booking_sources) ? hotel.booking_sources : [],
          
          // Metadata
          lastUpdated: hotel.last_updated || null,
          views: hotel.views ? {
            totalViews: hotel.views.total_views || 0,
            weeklyViews: hotel.views.weekly_views || 0
          } : { totalViews: 0, weeklyViews: 0 },
          totalViews: hotel.views?.total_views || 0, // Add flat property for easier access
          weeklyViews: hotel.views?.weekly_views || 0,
          
          // Include all original fields for compatibility
          ...hotel
        };
      });
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

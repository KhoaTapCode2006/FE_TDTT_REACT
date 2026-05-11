import { apiClient } from '../api/apiClient.js';
import { tokenManager } from '../../utils/tokenManager.js';
import { transformDiscoverHotel, transformDiscoverRequest } from '../../utils/schemaTransformers.js';
import { normalizeHotelResult } from '../../utils/format.js';

// Result caching
const resultCache = new Map();
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from search parameters
 */
function generateCacheKey(params) {
  const { location, checkIn, checkOut, guests, priceRange, radius, filters } = params;
  return JSON.stringify({
    location,
    checkIn: checkIn?.toISOString(),
    checkOut: checkOut?.toISOString(),
    guests,
    priceRange,
    radius,
    filters
  });
}

/**
 * Get cached result if available and not expired
 */
function getCachedResult(cacheKey) {
  const cached = resultCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
    return cached.data;
  }
  return null;
}

/**
 * Cache search result
 */
function setCachedResult(cacheKey, data) {
  resultCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Clean up expired entries periodically
  if (resultCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of resultCache.entries()) {
      if (now - value.timestamp >= CACHE_EXPIRY_MS) {
        resultCache.delete(key);
      }
    }
  }
}

/**
 * Get keywords for property type matching
 */
function getPropertyTypeKeywords(type) {
  const typeMap = {
    "Khách sạn": ["hotel", "khách sạn"],
    "Penthouse": ["penthouse"],
    "Resort": ["resort"],
    "Villa": ["villa"],
    "Homestay": ["homestay", "home stay"],
    "Nhà nghỉ": ["nhà nghỉ", "motel"],
    "Chung cư": ["apartment", "chung cư", "căn hộ"]
  };
  return typeMap[type] || [type.toLowerCase()];
}

/**
 * Apply client-side filtering on normalized hotel data
 */
function applyClientSideFiltersOnNormalized(hotels, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return hotels;
  }

  console.log('Applying filters:', filters);
  console.log('Hotels before filtering:', hotels.length);

  const filteredHotels = hotels.filter(hotel => {
    // Star rating filter
    if (filters.starRating !== null && filters.starRating !== undefined) {
      if (hotel.starRating < filters.starRating) {
        console.log(`Hotel ${hotel.name} filtered out by star rating: ${hotel.starRating} < ${filters.starRating}`);
        return false;
      }
    }

    // Property type filter (based on hotel type or name)
    if (filters.types && filters.types.length > 0) {
      const hotelName = (hotel.name || '').toLowerCase();
      const hotelType = (hotel.type || '').toLowerCase();
      
      const hasMatchingType = filters.types.some(type => {
        const typeKeywords = getPropertyTypeKeywords(type);
        return typeKeywords.some(keyword => 
          hotelName.includes(keyword.toLowerCase()) || 
          hotelType.includes(keyword.toLowerCase())
        );
      });
      if (!hasMatchingType) {
        console.log(`Hotel ${hotel.name} filtered out by type: ${hotel.type} not in ${filters.types}`);
        return false;
      }
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      const hotelAmenities = hotel.amenities || [];
      const hasMatchingAmenity = filters.amenities.some(filterAmenity => {
        return hotelAmenities.includes(filterAmenity);
      });
      if (!hasMatchingAmenity) {
        console.log(`Hotel ${hotel.name} filtered out by amenities: ${hotelAmenities} doesn't include any of ${filters.amenities}`);
        return false;
      }
    }

    // Price range filter
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      if (hotel.pricePerNight < filters.priceMin) {
        console.log(`Hotel ${hotel.name} filtered out by min price: ${hotel.pricePerNight} < ${filters.priceMin}`);
        return false;
      }
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      if (hotel.pricePerNight > filters.priceMax) {
        console.log(`Hotel ${hotel.name} filtered out by max price: ${hotel.pricePerNight} > ${filters.priceMax}`);
        return false;
      }
    }

    // Available rooms filter (placeholder - would need real availability data)
    if (filters.availableOnly) {
      // For now, assume all hotels have availability
      // In a real app, this would check actual availability
    }

    return true;
  });

  console.log('Hotels after filtering:', filteredHotels.length);
  return filteredHotels;
}

/**
 * Search hotels using backend /discover endpoint
 * Transforms request and response data using schema transformers
 * 
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search
 * @param {Date} params.checkIn - Check-in date
 * @param {Date} params.checkOut - Check-out date
 * @param {Object} params.guests - Guest information
 * @param {Object} params.priceRange - Price range filter
 * @param {number} params.radius - Search radius in meters
 * @param {Object} params.filters - Additional filters
 * @returns {Promise<Array>} Array of normalized hotel results
 */
export async function searchHotels({ 
  location, 
  checkIn, 
  checkOut, 
  guests, 
  priceRange = {}, 
  radius = 3000,
  filters = {} 
}) {
  // Generate cache key for this search
  const cacheKey = generateCacheKey({ location, checkIn, checkOut, guests, priceRange, radius, filters });
  
  // Check cache first
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    console.log('Returning cached results:', cachedResult.length);
    return cachedResult;
  }

  const childrenAges = (guests?.childrenAges || [])
    .map((age) => Math.round(age))
    .filter((age) => age >= 1 && age <= 17);

  const { minPrice = 0, maxPrice = 9999999 } = priceRange;

  // Build frontend request object
  const frontendRequest = {
    language: "vi",
    address: location,
    checkIn: (checkIn || new Date()).toISOString(),
    checkOut: (checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).toISOString(),
    minPrice: Math.round(minPrice ?? 0),
    maxPrice: Math.round(maxPrice ?? 9999999),
    radius,
    children: childrenAges,
    adults: guests?.adults ?? 2,
    personality: "string",
    // Add filter parameters
    starRating: filters.starRating,
    propertyTypes: filters.types,
    amenities: filters.amenities,
    availableOnly: filters.availableOnly
  };

  try {
    // Ensure we have a valid token (optional for discover endpoint)
    try {
      const token = await tokenManager.getToken();
      apiClient.setAuthToken(token);
    } catch (error) {
      console.warn('No authentication token available for discover request');
    }

    // Transform frontend request to backend format
    const backendRequest = transformDiscoverRequest(frontendRequest);

    // Call backend /discover endpoint
    const backendResponse = await apiClient.post('/discover', backendRequest);

    // Extract hotel data from response
    const backendHotels = backendResponse.data || backendResponse.hotels || backendResponse.results || [];
    const rawItems = Array.isArray(backendHotels) ? backendHotels : [];

    console.log('Raw items from API:', rawItems.length);

    // Transform each hotel from backend format to frontend format
    const transformedHotels = rawItems.map((item, index) => transformDiscoverHotel(item, index));
    
    // Normalize hotels for frontend use
    const normalizedHotels = transformedHotels.map((item) => normalizeHotelResult(item, location));
    
    // Apply client-side filtering on normalized data
    const finalResults = applyClientSideFiltersOnNormalized(normalizedHotels, filters);
    
    // Cache the results
    setCachedResult(cacheKey, finalResults);
    
    console.log(`Search completed: ${rawItems.length} raw → ${transformedHotels.length} transformed → ${normalizedHotels.length} normalized → ${finalResults.length} final results`);
    
    return finalResults;
  } catch (error) {
    console.error("searchHotels error:", error);
    
    // For demo purposes, return mock data when API fails
    console.log('API failed, loading mock data for demo...');
    
    try {
      // Load mock backend data as fallback
      const module = await import('../../constants/mock-backend-data.js');
      const MOCK_BACKEND_DATA = module.MOCK_BACKEND_DATA;
      
      if (MOCK_BACKEND_DATA && MOCK_BACKEND_DATA.data) {
        // Transform mock data using schema transformers
        const transformedHotels = MOCK_BACKEND_DATA.data.map((item, index) => transformDiscoverHotel(item, index));
        const normalizedHotels = transformedHotels.map((item) => normalizeHotelResult(item, location));
        const finalResults = applyClientSideFiltersOnNormalized(normalizedHotels, filters);
        
        console.log(`Mock data loaded: ${MOCK_BACKEND_DATA.data.length} raw → ${transformedHotels.length} transformed → ${normalizedHotels.length} normalized → ${finalResults.length} final results`);
        
        // Cache the mock results
        setCachedResult(cacheKey, finalResults);
        
        return finalResults;
      }
    } catch (mockError) {
      console.error('Failed to load mock data:', mockError);
    }
    
    // Enhance error with more specific information
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - please try again';
      error.code = 'TIMEOUT_ERROR';
    } else if (error.response || error.status) {
      // Server responded with error status
      error.code = 'SERVER_ERROR';
      error.statusCode = error.response?.status || error.status;
    } else if (error.request) {
      // Network error
      error.code = 'NETWORK_ERROR';
    }
    
    throw error;
  }
}
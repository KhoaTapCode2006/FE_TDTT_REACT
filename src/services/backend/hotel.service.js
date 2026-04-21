import axios from "axios";
import { normalizeHotelResult } from "@/utils/format";

const DISCOVER_ENDPOINT = "http://localhost:8010/proxy/api/v1/discover";

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
 * Transform frontend filter state to backend API parameters
 */
function transformFiltersToAPI(filters) {
  const apiParams = {};

  // Star rating filter - map to API parameter if supported
  if (filters.starRating !== null && filters.starRating !== undefined) {
    apiParams.star_rating = filters.starRating;
  }

  // Property types filter - may need to be handled client-side
  if (filters.types && filters.types.length > 0) {
    apiParams.property_types = filters.types;
  }

  // Amenities filter - map to API parameter if supported
  if (filters.amenities && filters.amenities.length > 0) {
    apiParams.amenities = filters.amenities;
  }

  // Available rooms only filter
  if (filters.availableOnly) {
    apiParams.available_only = true;
  }

  // Price range is already handled in the main function via priceRange parameter
  // but we can override if filters specify different values
  if (filters.priceMin !== null && filters.priceMin !== undefined) {
    apiParams.min_price = Math.round(filters.priceMin);
  }
  if (filters.priceMax !== null && filters.priceMax !== undefined) {
    apiParams.max_price = Math.round(filters.priceMax);
  }

  return apiParams;
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
 * Check if an item amenity matches a filter amenity
 */
function matchesAmenity(filterAmenity, itemAmenity) {
  const amenityMap = {
    "wifi": ["wifi", "wi-fi", "internet", "free wi-fi"],
    "pool": ["pool", "hồ bơi", "bể bơi", "swimming pool"],
    "fitness_center": ["gym", "fitness", "thể dục", "fitness center"],
    "spa": ["spa"],
    "restaurant": ["restaurant", "nhà hàng"],
    "bar": ["bar", "quầy bar"],
    "breakfast": ["breakfast", "bữa sáng", "ăn sáng"],
    "parking": ["parking", "đỗ xe", "bãi đỗ", "đỗ xe miễn phí", "free parking"],
    "ac": ["air conditioning", "điều hòa", "ac"],
    "pet_friendly": ["pet", "thú cưng", "pet friendly"],
    "laundry": ["laundry", "giặt ủi"],
    "shuttle": ["shuttle", "đưa đón", "airport shuttle"],
    "kitchen": ["kitchen", "bếp"]
  };

  const keywords = amenityMap[filterAmenity] || [filterAmenity];
  const itemAmenityLower = itemAmenity.toLowerCase();
  
  return keywords.some(keyword => itemAmenityLower.includes(keyword.toLowerCase()));
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

  // Transform filter state to API parameters
  const apiFilters = transformFiltersToAPI(filters);

  const payload = {
    language: "vi",
    address: location,
    check_in: (checkIn || new Date()).toISOString(),
    check_out: (checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).toISOString(),
    min_price: Math.round(minPrice ?? 0),
    max_price: Math.round(maxPrice ?? 9999999),
    radius,
    children: childrenAges,
    adults: guests?.adults ?? 2,
    personality: "string",
    // Add filter parameters
    ...apiFilters,
  };

  try {
    const response = await axios.post(DISCOVER_ENDPOINT, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;
    const inner = data?.data || data?.hotels || data?.results || [];
    const rawItems = Array.isArray(inner)
      ? inner
      : inner && Array.isArray(inner.hotels)
      ? inner.hotels
      : inner && Array.isArray(inner.results)
      ? inner.results
      : [];

    console.log('Raw items from API:', rawItems.length);

    // Transform to normalized format first
    const normalizedHotels = rawItems.map((item) => normalizeHotelResult(item, location));
    
    // Apply client-side filtering on normalized data
    const finalResults = applyClientSideFiltersOnNormalized(normalizedHotels, filters);
    
    // Cache the results
    setCachedResult(cacheKey, finalResults);
    
    console.log(`Search completed: ${rawItems.length} raw → ${normalizedHotels.length} normalized → ${finalResults.length} final results`);
    
    return finalResults;
  } catch (error) {
    console.error("searchHotels error:", error);
    
    // For demo purposes, return mock data when API fails
    console.log('API failed, loading mock data for demo...');
    
    try {
      // Load mock backend data as fallback
      const module = await import('@/constants/mock-backend-data');
      const MOCK_BACKEND_DATA = module.MOCK_BACKEND_DATA;
      
      if (MOCK_BACKEND_DATA && MOCK_BACKEND_DATA.data) {
        const normalizedHotels = MOCK_BACKEND_DATA.data.map((item) => normalizeHotelResult(item, location));
        const finalResults = applyClientSideFiltersOnNormalized(normalizedHotels, filters);
        
        console.log(`Mock data loaded: ${MOCK_BACKEND_DATA.data.length} raw → ${normalizedHotels.length} normalized → ${finalResults.length} final results`);
        
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
    } else if (error.response) {
      // Server responded with error status
      error.code = 'SERVER_ERROR';
      error.statusCode = error.response.status;
    } else if (error.request) {
      // Network error
      error.code = 'NETWORK_ERROR';
    }
    
    throw error;
  }
}
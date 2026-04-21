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
 * Apply client-side filtering for properties not supported by the API
 */
function applyClientSideFilters(items, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return items;
  }

  return items.filter(item => {
    // Star rating filter (if not handled by API)
    if (filters.starRating !== null && filters.starRating !== undefined) {
      const itemRating = item.raw_rating || 0;
      if (itemRating < filters.starRating) {
        return false;
      }
    }

    // Property type filter (client-side based on name or other fields)
    if (filters.types && filters.types.length > 0) {
      const itemName = (item.name || '').toLowerCase();
      const hasMatchingType = filters.types.some(type => {
        const typeKeywords = getPropertyTypeKeywords(type);
        return typeKeywords.some(keyword => itemName.includes(keyword.toLowerCase()));
      });
      if (!hasMatchingType) {
        return false;
      }
    }

    // Amenities filter (client-side based on amenities array)
    if (filters.amenities && filters.amenities.length > 0) {
      const itemAmenities = item.amenities || [];
      const hasMatchingAmenity = filters.amenities.some(filterAmenity => {
        return itemAmenities.some(itemAmenity => {
          return matchesAmenity(filterAmenity, itemAmenity);
        });
      });
      if (!hasMatchingAmenity) {
        return false;
      }
    }

    // Price range filter (if not handled by API)
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      if ((item.price || 0) < filters.priceMin) {
        return false;
      }
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      if ((item.price || 0) > filters.priceMax) {
        return false;
      }
    }

    return true;
  });
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
    "wifi": ["wifi", "wi-fi", "internet"],
    "pool": ["pool", "hồ bơi", "bể bơi"],
    "fitness_center": ["gym", "fitness", "thể dục"],
    "spa": ["spa"],
    "restaurant": ["restaurant", "nhà hàng"],
    "bar": ["bar", "quầy bar"],
    "breakfast": ["breakfast", "bữa sáng"],
    "parking": ["parking", "đỗ xe", "bãi đỗ"],
    "ac": ["air conditioning", "điều hòa", "ac"],
    "pet_friendly": ["pet", "thú cưng"],
    "laundry": ["laundry", "giặt ủi"],
    "shuttle": ["shuttle", "đưa đón"],
    "kitchen": ["kitchen", "bếp"]
  };

  const keywords = amenityMap[filterAmenity] || [filterAmenity];
  const itemAmenityLower = itemAmenity.toLowerCase();
  
  return keywords.some(keyword => itemAmenityLower.includes(keyword.toLowerCase()));
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

    // Apply client-side filtering for properties not supported by API
    const filteredItems = applyClientSideFilters(rawItems, filters);

    const results = filteredItems.map((item) => normalizeHotelResult(item, location));
    
    // Cache the results
    setCachedResult(cacheKey, results);
    
    return results;
  } catch (error) {
    console.error("searchHotels error:", error);
    
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

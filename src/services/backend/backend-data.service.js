// Service để transform backend JSON sang app format

const AMENITY_MAP = {
  "wifi": "wifi",
  "wi-fi": "wifi",
  "free wi-fi": "wifi",
  "hồ bơi": "pool",
  "bể bơi": "pool",
  "swimming pool": "pool",
  "gym": "fitness_center",
  "fitness center": "fitness_center",
  "spa": "spa",
  "nhà hàng": "restaurant",
  "quầy bar": "bar",
  "breakfast": "breakfast",
  "ăn sáng": "breakfast",
  "đỗ xe": "parking",
  "đỗ xe miễn phí": "parking",
  "parking": "parking",
  "ac": "ac",
  "điều hòa": "ac",
  "pet friendly": "pet_friendly",
  "laundry": "laundry",
  "full-service laundry": "laundry",
  "airport shuttle": "shuttle",
  "kitchen": "kitchen",
};

function normalizeAmenity(amenity) {
  if (!amenity) return null;
  const key = amenity.toLowerCase().trim();
  return AMENITY_MAP[key] || null;
}

function extractAmenities(amenitiesArray) {
  if (!Array.isArray(amenitiesArray)) return [];
  const normalized = amenitiesArray.map(a => normalizeAmenity(a)).filter(Boolean);
  return [...new Set(normalized)];
}

function extractImageUrls(imagesArray) {
  if (!Array.isArray(imagesArray)) return [];
  return imagesArray
    .map(img => {
      if (typeof img === 'string') return img;
      if (img?.original_image) return img.original_image;
      return null;
    })
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeRating(aiScore) {
  if (!aiScore || aiScore < 0) return 3;
  return Math.min(aiScore, 5);
}

export function transformBackendHotel(backendHotel, index = 0) {
  if (!backendHotel) return null;
  
  const {
    property_token,
    name,
    gps_coordinates,
    price,
    images,
    amenities,
    ai_score,
    address,
    user_reviews,
  } = backendHotel;
  
  const lat = gps_coordinates?.latitude || 10.8;
  const lng = gps_coordinates?.longitude || 106.8;
  const normalizedAmenities = extractAmenities(amenities);
  const imageUrls = extractImageUrls(images);
  const rating = normalizeRating(ai_score);
  
  let badge = null;
  if (rating >= 4.8) badge = "Excellent";
  else if (rating >= 4.5) badge = "Very Good";
  else if (rating >= 4.0) badge = "Good";
  
  return {
    // Use fallback ID when property_token is null/undefined
    // Format: hotel-fallback-{timestamp}-{index} to ensure uniqueness and traceability
    // This prevents ReferenceError when property_token is missing from backend data
    id: property_token || `hotel-fallback-${Date.now()}-${index}`,
    name: name || "Unknown Hotel",
    type: "Hotel",
    badge,
    rating,
    reviewCount: user_reviews?.length || 0,
    pricePerNight: price || 1000000,
    currency: "VND",
    address: address || "Ho Chi Minh City",
    lat,
    lng,
    amenities: normalizedAmenities,
    starRating: Math.ceil(rating),
    images: imageUrls,
    latestReview: null,
    nearbyLandmarks: [],
  };
}

export function transformBackendResponse(backendData) {
  if (!backendData) return [];
  const hotelsArray = backendData.data || backendData;
  if (!Array.isArray(hotelsArray)) return [];
  return hotelsArray.map((hotel, i) => transformBackendHotel(hotel, i)).filter(Boolean);
}

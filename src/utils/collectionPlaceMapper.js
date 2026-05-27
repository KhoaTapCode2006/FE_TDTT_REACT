/**
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isValidAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'string') return false;
  return /^https?:\/\//i.test(trimmed);
}

/**
 * Map collection place API payload to HotelPopup-friendly shape.
 * This mapper ensures 100% compatibility with HotelPopup component by matching
 * the exact data structure used by hotelSearchService.searchHotels().
 * 
 * @param {Object|null|undefined} place - Raw place data from Collection API
 * @returns {Object|null} - Hotel object compatible with HotelPopup
 */
export function mapCollectionPlaceToHotel(place) {
  if (!place) return null;

  // Extract GPS coordinates with proper fallbacks
  const coords = place.gps_coordinates;
  const gpsLat = coords?.latitude || place.latitude || null;
  const gpsLng = coords?.longitude || place.longitude || null;

  // Process images - transform to object format with thumbnail and original
  const images = Array.isArray(place.images) ? place.images.map(img => {
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

  // Calculate rating (prefer ai_score from ai_sentiment)
  const aiScore = place.ai_sentiment?.ai_score ?? null;
  const rating = aiScore != null 
    ? Number(aiScore) 
    : (Number(place.raw_rating) > 0 ? Number(place.raw_rating) : 0);

  // Process reviews - map to both userReviews AND reviews for compatibility
  const userReviews = Array.isArray(place.user_reviews) ? place.user_reviews : [];
  const reviews = userReviews.map((review, index) => ({
    author: review.author || `Khách ${index + 1}`,
    content: review.text || review.content || '',
    raw_star: review.raw_stars || review.raw_star || Math.round(rating),
    text: review.text || review.content || ''
  }));

  // Calculate address with fallback
  const address = place.address ||
    (gpsLat != null && gpsLng != null
      ? `${Number(gpsLat).toFixed(5)}, ${Number(gpsLng).toFixed(5)}`
      : 'Chưa có địa chỉ');

  // Transform to match hotelSearchService.searchHotels() output format
  return {
    // IDs
    id: place.place_id || place.property_token || place.id,
    propertyToken: place.property_token || place.place_id,
    hotel_id: place.property_token || place.place_id,
    
    // Basic info
    name: place.name || 'Khách sạn',
    description: place.description || place.ai_summary?.overview || null,
    address,
    location: address,
    phone: place.phone || null,
    link: place.link || null,
    
    // GPS - use null instead of 0 for invalid coordinates
    latitude: gpsLat,
    longitude: gpsLng,
    lat: gpsLat,
    lng: gpsLng,
    coordinates: {
      latitude: gpsLat || 0,
      longitude: gpsLng || 0,
      geohash: coords?.geohash || ''
    },
    
    // Pricing
    price: place.price || 0,
    pricePerNight: place.price || 0,
    deal: place.deal || null,
    currency: 'VND',
    
    // Rating - use ai_score from ai_sentiment
    rating,
    rawRating: place.raw_rating || 0,
    ai_score: aiScore || 0,
    trustWeight: place.ai_sentiment?.trust_weight || 0,
    
    // AI Sentiment (camelCase format for HotelPopup)
    aiSentiment: place.ai_sentiment ? {
      aiScore: place.ai_sentiment.ai_score || 0,
      trustWeight: place.ai_sentiment.trust_weight || 0,
      analyzedReviews: place.ai_sentiment.analyzed_reviews?.length || 0
    } : null,
    
    // Images - store as objects with both thumbnail and original
    images,
    thumbnail: images.length > 0 ? images[0].thumbnail : null,
    
    // Amenities - pass through as-is
    amenities: Array.isArray(place.amenities) ? place.amenities : [],
    originalAmenities: place.amenities,
    
    // Reviews - map to both userReviews AND reviews for compatibility
    userReviews,
    reviews,
    analyzedReviews: Array.isArray(place.ai_sentiment?.analyzed_reviews) 
      ? place.ai_sentiment.analyzed_reviews 
      : [],
    
    // AI Summary (camelCase format for HotelPopup)
    aiSummary: place.ai_summary ? {
      overview: place.ai_summary.overview || '',
      pros: Array.isArray(place.ai_summary.pros) ? place.ai_summary.pros : [],
      cons: Array.isArray(place.ai_summary.cons) ? place.ai_summary.cons : [],
      notes: place.ai_summary.notes || ''
    } : null,
    
    // Additional info
    nearbyPlaces: Array.isArray(place.nearby_places) ? place.nearby_places : [],
    nearbyLandmarks: Array.isArray(place.nearby_places) 
      ? place.nearby_places.map(p => ({
          name: p.name || p,
          distance: p.distance || 'N/A'
        }))
      : [],
    distance: place.distance || 0,
    checkInTime: place.check_in_time || null,
    checkOutTime: place.check_out_time || null,
    bookingSources: Array.isArray(place.booking_sources) ? place.booking_sources : [],
    
    // Metadata
    lastUpdated: place.last_updated || null,
    views: place.views ? {
      totalViews: place.views.total_views || 0,
      weeklyViews: place.views.weekly_views || 0,
      total_views: place.views.total_views || 0,
      weekly_views: place.views.weekly_views || 0
    } : { totalViews: 0, weeklyViews: 0, total_views: 0, weekly_views: 0 },
    totalViews: place.views?.total_views || 0,
    weeklyViews: place.views?.weekly_views || 0
  };
}

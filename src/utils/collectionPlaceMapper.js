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
 * @param {Object|null|undefined} place
 * @returns {Object|null}
 */
export function mapCollectionPlaceToHotel(place) {
  if (!place) return null;

  const images = (place.images || [])
    .map((img) => img?.original_image || img?.thumbnail)
    .filter(Boolean);

  const aiScore = place.ai_sentiment?.ai_score ?? null;
  const rating =
    Number(place.raw_rating) > 0
      ? Number(place.raw_rating)
      : aiScore != null
        ? Number(aiScore)
        : 0;

  const reviews = (place.user_reviews || []).map((review, index) => ({
    author: `Khách ${index + 1}`,
    content: review.text,
    raw_star: review.raw_stars,
  }));

  const coords = place.gps_coordinates;
  const address =
    place.address ||
    (coords?.latitude != null && coords?.longitude != null
      ? `${Number(coords.latitude).toFixed(5)}, ${Number(coords.longitude).toFixed(5)}`
      : 'Chưa có địa chỉ');

  return {
    id: place.place_id,
    property_token: place.place_id,
    name: place.name || 'Khách sạn',
    address,
    description: place.description || place.ai_summary?.overview || null,
    price: place.price,
    pricePerNight: place.price,
    rating,
    ai_score: aiScore,
    images: images.length ? images : ['https://via.placeholder.com/640x480?text=No+Image'],
    amenities: place.amenities || [],
    reviews,
    link: place.link,
    check_in_time: place.check_in_time,
    check_out_time: place.check_out_time,
    ai_summary: place.ai_summary,
    views: place.views,
    added_by: place.added_by,
    added_at: place.added_at,
  };
}

export function fmtPrice(n, currency = "VND") {
  if (currency === "VND") {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M VND`;
    return `${(n / 1e3).toFixed(0)}K VND`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Format view count with K/M suffixes
 * @param {number} count - View count number
 * @returns {string} Formatted view count (e.g., "1.2K", "1.5M")
 */
export function formatViewCount(count) {
  if (!count || typeof count !== 'number') return '0';
  
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}

export function fmtDate(d) {
  if (!d) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function normalizeAmenityKey(rawAmenity) {
  if (!rawAmenity) return "";
  const value = String(rawAmenity).trim().toLowerCase();
  if (value.includes("wifi")) return "wifi";
  if (value.includes("breakfast")) return "breakfast";
  if (value.includes("parking")) return "parking";
  if (value.includes("air condition") || value.includes("air-conditioning") || value.includes("ac")) return "ac";
  if (value.includes("pet")) return "pet_friendly";
  if (value.includes("laundry")) return "laundry";
  if (value.includes("spa")) return "spa";
  if (value.includes("pool")) return "pool";
  if (value.includes("restaurant")) return "restaurant";
  if (value.includes("bar")) return "bar";
  if (value.includes("kitchen")) return "kitchen";
  if (value.includes("shuttle")) return "shuttle";
  return String(rawAmenity);
}

export function normalizeHotelResult(raw, fallbackLocation) {
  // ── Safety: reject completely malformed input ──────────────────────────
  if (!raw || typeof raw !== 'object') return null;

  // ── Coordinates ────────────────────────────────────────────────────────
  // sample_output_2.json: { gps_coordinates: { latitude, longitude } }
  const gps = raw.gps_coordinates || {};
  const lat = parseFloat(gps.latitude ?? raw.lat ?? raw.latitude) || null;
  const lng = parseFloat(gps.longitude ?? raw.lng ?? raw.longitude) || null;

  // ── Images ─────────────────────────────────────────────────────────────
  // sample_output_2.json: images: [{ thumbnail, original_image }]
  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const imageUrls = rawImages
    .map(img =>
      typeof img === 'string'
        ? img
        : img.original_image || img.thumbnail || img.url || null
    )
    .filter(Boolean);

  // Always guarantee at least one image so cluster markers never break
  const images = imageUrls.length > 0
    ? imageUrls
    : ['/placeholder.png'];

  // ── Rating ─────────────────────────────────────────────────────────────
  // sample_output_2.json: raw_rating (0–5), ai_score (float)
  const rating = Number(raw.raw_rating || raw.ai_score || raw.rating || 0);
  const starRating = Math.min(5, Math.max(0, Math.ceil(rating)));

  // ── Amenities ──────────────────────────────────────────────────────────
  // sample_output_2.json: amenities: ["Đỗ xe miễn phí", ...]
  const amenities = Array.isArray(raw.amenities)
    ? raw.amenities
        .map(a => (typeof a === 'string' ? a : a.label || String(a)))
        .map(normalizeAmenityKey)
        .filter(Boolean)
    : [];

  // ── Reviews ────────────────────────────────────────────────────────────
  // API response: user_reviews: [{ text, raw_rating }] (snake_case)
  // After transform: userReviews: [{ text, rawRating }] (camelCase)
  const rawReviews = raw.userReviews || raw.user_reviews || [];
  const reviews = Array.isArray(rawReviews)
    ? rawReviews.map(r => ({
        author: r.reviewerName || r.reviewer_name || r.author || 'Khách',
        text: r.reviewText || r.review_text || r.text || r.comment || '',
        rawRating: r.rawRating ?? r.raw_rating ?? r.rawStars ?? r.raw_stars ?? r.raw_star ?? 0,
      }))
    : [];

  const latestReview = raw.latestReview || reviews[0] || null;

  // ── Nearby places ──────────────────────────────────────────────────────
  // sample_output_2.json: nearby_places: []
  const nearbyLandmarks = Array.isArray(raw.nearby_places)
    ? raw.nearby_places.map(p => ({
        name: p.name || String(p),
        distance: p.distance || '',
      }))
    : Array.isArray(raw.nearbyLandmarks)
      ? raw.nearbyLandmarks
      : [];

  return {
    // Identity
    id: raw.id || raw.property_token || raw.link || Math.random().toString(36).slice(2),
    name: raw.name || 'Unknown Hotel',
    type: raw.type || 'Hotel',
    badge: raw.badge || raw.deal || null,
    link: raw.link || null,

    // Geography — null means Supercluster will skip this point (safe)
    lat,
    lng,

    // Pricing
    pricePerNight: Number(raw.price || raw.pricePerNight || 0),
    currency: raw.currency || 'VND',

    // Location
    address: raw.address || fallbackLocation || '',
    nearbyLandmarks,

    // Visuals — always an array with at least one URL
    images,
    thumbnail: images[0],

    // Ratings
    rating,
    starRating,
    reviewCount: Number(raw.reviewCount ?? reviews.length),

    // Content
    amenities,
    latestReview,
    reviews,
    userReviews: reviews, // Alias for consistency with transformed data

    // AI metadata
    ai_score: raw.ai_score != null ? Number(raw.ai_score) : null,
  };
}

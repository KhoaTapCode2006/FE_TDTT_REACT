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
  const gps = raw.gps_coordinates || {};
  const images = Array.isArray(raw.images)
    ? raw.images
        .map(img => (typeof img === "string" ? img : img.original_image || img.url || img.thumbnail))
        .filter(Boolean)
    : [];

  const normalizedImages = images.length > 0
    ? images
    : ["https://via.placeholder.com/640x480?text=No+Image"];

  const amenities = Array.isArray(raw.amenities)
    ? raw.amenities
        .map(a => (typeof a === "string" ? a : a.label || String(a)))
        .map(normalizeAmenityKey)
        .filter(Boolean)
    : [];

  const reviews = Array.isArray(raw.user_reviews)
    ? raw.user_reviews.map(r => ({ author: r.author || "Khách", text: r.text || r.comment || "Đã nhận xét" }))
    : [];

  const latestReview = raw.latestReview || reviews[0] || null;

  return {
    id: raw.id || raw.property_token || raw.link || Math.random().toString(36).slice(2),
    name: raw.name || "Unknown Hotel",
    type: raw.type || "Hotel",
    badge: raw.badge || raw.deal || null,
    rating: Number(raw.raw_rating || raw.ai_score || raw.rating || 0),
    reviewCount: Number(raw.reviewCount || reviews.length || 0),
    pricePerNight: Number(raw.price || raw.pricePerNight || 0),
    currency: raw.currency || "VND",
    address: raw.address || fallbackLocation || "",
    lat: parseFloat(gps.latitude) || null,
    lng: parseFloat(gps.longitude) || null,
    amenities,
    images: normalizedImages,
    thumbnail: normalizedImages[0] || null,
    latestReview,
    reviews,
    nearbyLandmarks: Array.isArray(raw.nearby_places)
      ? raw.nearby_places.map(place => ({ name: place.name || place, distance: place.distance || "" }))
      : Array.isArray(raw.nearbyLandmarks)
        ? raw.nearbyLandmarks
        : [],
    link: raw.link || null,
  };
}

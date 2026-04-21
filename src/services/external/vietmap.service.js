// CHỈ CHỨA LOGIC - KHÔNG CHỨA JSX
export const VIETMAP_CONFIG = {
  STYLE_URL: "https://maps.vietmap.vn/maps/styles/dm/style.json",
  API_KEY: "6033c4efaa0e172ca5cb9ebc5c9d394da9a38466072ce84e",
};

export function getVietMapStyleUrl() {
  return `${VIETMAP_CONFIG.STYLE_URL}?apikey=${VIETMAP_CONFIG.API_KEY}`;
}

export function getDistanceMeters(a, b) {
  const R = 6371000;
  const φ1 = a.lat * Math.PI / 180;
  const φ2 = b.lat * Math.PI / 180;
  const Δφ = (b.lat - a.lat) * Math.PI / 180;
  const Δλ = (b.lng - a.lng) * Math.PI / 180;
  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);
  const h = sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function buildCircleGeoJSON(center, radius) {
  const coords = [];
  const R = 6371000;
  const φ1 = center.lat * Math.PI / 180;
  const λ1 = center.lng * Math.PI / 180;
  const δ = radius / R;

  for (let i = 0; i <= 64; i += 1) {
    const θ = (i / 64) * 2 * Math.PI;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    coords.push([λ2 * 180 / Math.PI, φ2 * 180 / Math.PI]);
  }

  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

export function buildHotelGeoJSON(hotels) {
  return {
    type: "FeatureCollection",
    features: hotels
      .filter((h) => h.lat != null && h.lng != null)
      .map((h) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [h.lng, h.lat] },
        properties: { 
          hotelId: h.id, 
          name: h.name, 
          price: h.pricePerNight,
          address: h.address || "",
          link: h.link || "",
        },
      })),
  };
}

export function getRadiusForCoverage(center, hotels, coverage = 0.5) {
  const distances = hotels
    .filter((h) => h.lat != null && h.lng != null)
    .map((h) => getDistanceMeters(center, { lat: h.lat, lng: h.lng }))
    .sort((a, b) => a - b);

  if (!distances.length) return 0;
  const index = Math.min(distances.length - 1, Math.max(0, Math.floor(distances.length * coverage) - 1));
  return distances[index] * 1.15;
}

// ── New Advanced Utility Functions ──────────────────────────────────────────

/**
 * Calculate a point on a circle at a specific bearing from the center
 * @param {Object} center - Center point with lat/lng
 * @param {number} radius - Radius in meters
 * @param {number} bearing - Bearing in degrees (0 = North, 90 = East)
 * @returns {Array} [lng, lat] coordinates
 */
export function getCirclePoint(center, radius, bearing = 90) {
  // Validate inputs
  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
    console.warn('Invalid center for getCirclePoint:', center);
    return null;
  }
  if (typeof radius !== 'number' || radius <= 0) {
    console.warn('Invalid radius for getCirclePoint:', radius);
    return null;
  }
  if (typeof bearing !== 'number') {
    console.warn('Invalid bearing for getCirclePoint:', bearing);
    return null;
  }

  try {
    const R = 6371000;
    const φ1 = center.lat * Math.PI / 180;
    const λ1 = center.lng * Math.PI / 180;
    const δ = radius / R;
    const θ = bearing * Math.PI / 180;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
    const λ2 = λ1 + Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );
    
    const lng = λ2 * 180 / Math.PI;
    const lat = φ2 * 180 / Math.PI;
    
    // Validate results
    if (!isFinite(lng) || !isFinite(lat)) {
      console.warn('Invalid calculated coordinates:', { lng, lat });
      return null;
    }
    
    return [lng, lat];
  } catch (error) {
    console.error('Error calculating circle point:', error);
    return null;
  }
}

/**
 * Calculate bounds that encompass a circle
 * @param {Object} center - Center point with lat/lng
 * @param {number} radius - Radius in meters
 * @returns {Array} VietMap fitBounds-compatible array [[west, south], [east, north]]
 */
export function getCircleBounds(center, radius) {
  // Validate inputs
  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
    console.warn('Invalid center for getCircleBounds:', center);
    return null;
  }
  if (typeof radius !== 'number' || radius <= 0) {
    console.warn('Invalid radius for getCircleBounds:', radius);
    return null;
  }

  try {
    const east = getCirclePoint(center, radius, 90);
    const west = getCirclePoint(center, radius, 270);
    const north = getCirclePoint(center, radius, 0);
    const south = getCirclePoint(center, radius, 180);
    
    // Validate calculated points
    if (!east || !west || !north || !south) {
      console.warn('Failed to calculate circle points');
      return null;
    }
    
    // Return in the format expected by VietMap fitBounds: [[west, south], [east, north]]
    const bounds = [[west[0], south[1]], [east[0], north[1]]];
    
    // Validate bounds format
    if (!Array.isArray(bounds) || bounds.length !== 2 || 
        !Array.isArray(bounds[0]) || !Array.isArray(bounds[1]) ||
        bounds[0].length !== 2 || bounds[1].length !== 2) {
      console.warn('Invalid bounds format:', bounds);
      return null;
    }
    
    return bounds;
  } catch (error) {
    console.error('Error calculating circle bounds:', error);
    return null;
  }
}

/**
 * Build bounds that encompass a collection of hotels
 * @param {Object} center - Center point with lat/lng
 * @param {Array} hotels - Array of hotel objects with lat/lng
 * @param {number} coverage - Coverage percentage (0.5 = 50% of hotels)
 * @returns {Array|null} VietMap fitBounds-compatible array [[west, south], [east, north]] or null
 */
export function buildBoundsForHotels(center, hotels, coverage = 0.5) {
  const sorted = hotels
    .filter(hotel => hotel.lat != null && hotel.lng != null)
    .map(hotel => ({ hotel, distance: getDistanceMeters(center, { lat: hotel.lat, lng: hotel.lng }) }))
    .sort((a, b) => a.distance - b.distance);

  if (!sorted.length) return null;
  
  const count = Math.max(1, Math.floor(sorted.length * coverage));
  let minLng = center.lng, maxLng = center.lng;
  let minLat = center.lat, maxLat = center.lat;
  
  sorted.slice(0, count).forEach(item => {
    minLng = Math.min(minLng, item.hotel.lng);
    maxLng = Math.max(maxLng, item.hotel.lng);
    minLat = Math.min(minLat, item.hotel.lat);
    maxLat = Math.max(maxLat, item.hotel.lat);
  });
  
  // Return in the format expected by VietMap fitBounds: [[west, south], [east, north]]
  return [[minLng, minLat], [maxLng, maxLat]];
}

/**
 * Get coordinates for radius handle positioned at 45-degree angle
 * @param {Object} center - Center point with lat/lng
 * @param {number} radius - Radius in meters
 * @returns {Array} [lng, lat] coordinates for handle
 */
export function getRadiusHandleCoordinates(center, radius) {
  return getCirclePoint(center, radius, 45);
}

/**
 * Create hotel marker element with proper styling and interactions
 * @param {Object} hotel - Hotel object with properties
 * @param {boolean} insideCircle - Whether hotel is inside search radius
 * @param {Function} onSelect - Callback when hotel is selected
 * @returns {HTMLElement} Marker element
 */
export function createHotelMarkerElement(hotel, insideCircle, onSelect) {
  const size = insideCircle ? 52 : 42;
  const element = document.createElement("div");
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "50%";
  element.style.overflow = "hidden";
  element.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.95),0 10px 22px rgba(0,0,0,0.22)";
  element.style.border = "2px solid rgba(255,255,255,0.95)";
  element.style.cursor = "pointer";
  element.style.backgroundColor = "#ffffff";
  element.style.transition = "width 0.2s ease, height 0.2s ease, transform 0.2s ease";
  
  if (insideCircle) {
    element.className = "hotel-marker-flicker";
    element.style.transform = "scale(1.05)";
  }

  const image = document.createElement("img");
  image.src = hotel.thumbnail || hotel.images?.[0] || "";
  image.alt = hotel.name || "Hotel";
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "cover";
  image.style.display = "block";
  element.appendChild(image);

  element.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect?.(hotel);
  });

  return element;
}

/**
 * Generate HTML content for hotel popup
 * @param {Object} hotel - Hotel object with properties
 * @returns {string} HTML string for popup content
 */
export function getPopupHtml(hotel) {
  // Format price using existing utility pattern
  const formatPrice = (n, currency = "VND") => {
    if (currency === "VND") {
      if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M VND`;
      return `${(n / 1e3).toFixed(0)}K VND`;
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  };

  return `
    <div style="font-family:Inter,sans-serif;font-size:14px;line-height:1.4;max-width:320px;">
      <strong style="color:#00346f;">${hotel.name}</strong>
      <div style="margin:6px 0 4px;color:#4d5a6b;font-size:13px;">${hotel.address || ""}</div>
      <div style="font-weight:700;color:#ff5722;">${formatPrice(hotel.pricePerNight)}</div>
      ${hotel.link ? `<div style="margin-top:8px;"><a href="${hotel.link}" target="_blank" style="color:#00346f;font-weight:700;text-decoration:none;">Open hotel</a></div>` : ""}
    </div>`;
}

/**
 * Clamp radius value to valid range and round to nearest 100m
 * @param {number} radius - Input radius value
 * @returns {number} Clamped and rounded radius
 */
export function clampRadius(radius) {
  return Math.min(40000, Math.max(500, Math.round(radius / 100) * 100));
}
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
 * @param {boolean} isHovered - Whether this hotel is currently hovered in sidebar
 * @returns {HTMLElement} Marker element with wrapper and inner structure
 */
export function createHotelMarkerElement(hotel, insideCircle, onSelect, isHovered = false) {
  const size = insideCircle ? 52 : 42;
  
  // Create wrapper div (no styles - map handles positioning)
  const wrapper = document.createElement("div");
  wrapper.dataset.hotelId = hotel.id; // Store hotel ID for later updates
  wrapper.style.zIndex = isHovered ? '1000' : '1'; // Elevated z-index when hovered
  
  // Create inner div with all visual styles
  const inner = document.createElement("div");
  inner.className = "hotel-marker-item hotel-marker-inner";
  inner.dataset.hotelId = hotel.id;
  inner.style.width = `${size}px`;
  inner.style.height = `${size}px`;
  inner.style.borderRadius = "50%";
  inner.style.overflow = "hidden";
  inner.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.95),0 10px 22px rgba(0,0,0,0.22)";
  inner.style.border = "2px solid rgba(255,255,255,0.95)";
  inner.style.cursor = "pointer";
  inner.style.backgroundColor = "#ffffff";
  inner.style.transition = "transform 0.2s ease";
  
  // Apply hover scale effect
  if (isHovered) {
    inner.style.transform = "scale(1.3)";
  } else if (insideCircle) {
    inner.className = "hotel-marker-flicker hotel-marker-item hotel-marker-inner";
    inner.style.transform = "scale(1.05)";
  } else {
    inner.style.transform = "scale(1)";
  }

  const image = document.createElement("img");
  image.src = hotel.thumbnail || hotel.images?.[0] || "";
  image.alt = hotel.name || "Hotel";
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "cover";
  image.style.display = "block";
  inner.appendChild(image);

  inner.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect?.(hotel);
  });

  wrapper.appendChild(inner);
  return wrapper;
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


// ── Supercluster Utility Functions ──────────────────────────────────────────

/**
 * Validate hotel coordinates to filter out invalid entries
 * @param {Array} hotels - Array of hotel objects
 * @returns {Array} Array of hotels with valid coordinates
 */
export function validateHotelCoordinates(hotels) {
  if (!Array.isArray(hotels)) {
    console.warn('validateHotelCoordinates: hotels is not an array');
    return [];
  }

  return hotels.filter(hotel => {
    if (!hotel) return false;
    
    const { lat, lng } = hotel;
    
    // Check if coordinates exist
    if (lat == null || lng == null) return false;
    
    // Check if coordinates are numbers
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    
    // Check if coordinates are not NaN
    if (isNaN(lat) || isNaN(lng)) return false;
    
    // Check if coordinates are finite
    if (!isFinite(lat) || !isFinite(lng)) return false;
    
    return true;
  });
}

/**
 * Convert hotel objects to GeoJSON Feature format for supercluster
 * @param {Array} hotels - Array of hotel objects
 * @returns {Array} Array of GeoJSON Feature objects
 */
export function convertHotelsToSuperclusterPoints(hotels) {
  if (!Array.isArray(hotels)) {
    console.warn('convertHotelsToSuperclusterPoints: hotels is not an array');
    return [];
  }

  return hotels.map(hotel => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [hotel.lng, hotel.lat]
    },
    properties: {
      hotel: hotel
    }
  }));
}

/**
 * Get hotel thumbnail URL with fallbacks
 * @param {Object} hotel - Hotel object
 * @returns {string} Thumbnail URL or placeholder
 */
export function getHotelThumbnailUrl(hotel) {
  if (!hotel) return '/placeholder-hotel.jpg';
  
  // Try thumbnail first
  if (hotel.thumbnail) return hotel.thumbnail;
  
  // Try first image
  if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
    return hotel.images[0];
  }
  
  // Fallback to placeholder
  return '/placeholder-hotel.jpg';
}

/**
 * Get cluster badge text showing additional hotel count
 * @param {number} count - Total number of hotels in cluster
 * @returns {string} Badge text (e.g., "+2" for 3 hotels) or empty string
 */
export function getClusterBadgeText(count) {
  if (typeof count !== 'number' || count <= 1) return '';
  return `+${count - 1}`;
}


/**
 * Create cluster marker element with hotel thumbnail and badge
 * @param {Object} cluster - Cluster object from supercluster
 * @param {Object} firstHotel - First hotel in the cluster
 * @param {number} hotelCount - Total number of hotels in cluster
 * @param {Function} onClick - Click handler callback
 * @param {Array} clusterHotelIds - Array of hotel IDs in this cluster
 * @param {string} hoveredHotelId - ID of currently hovered hotel
 * @returns {HTMLElement} Cluster marker element
 */
export function createClusterMarkerElement(cluster, firstHotel, hotelCount, onClick, clusterHotelIds = [], hoveredHotelId = null) {
  // ── Wrapper ──────────────────────────────────────────────────────────────
  // Fixed 60×60 size + position:relative so the badge's absolute positioning
  // anchors to this box, not to some distant ancestor.
  // The map library applies its own transform to this element for geo-positioning,
  // so we must NOT put any scale/transition here.
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '60px';
  wrapper.style.height = '60px';
  wrapper.style.cursor = 'pointer';
  wrapper.dataset.clusterId = cluster.properties?.cluster_id || 'single';
  wrapper.dataset.clusterHotelIds = JSON.stringify(clusterHotelIds);

  // ── Inner (main circle with hotel photo) ─────────────────────────────────
  // Fills the wrapper exactly. All visual styles + scale transition live here.
  const inner = document.createElement('div');
  inner.className = 'cluster-marker-inner';
  inner.dataset.clusterHotelIds = JSON.stringify(clusterHotelIds);
  inner.style.width = '100%';
  inner.style.height = '100%';
  inner.style.borderRadius = '50%';
  inner.style.border = '3px solid white';
  inner.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
  inner.style.overflow = 'hidden';
  inner.style.backgroundColor = '#ffffff';
  inner.style.transition = 'transform 0.2s ease-out';

  // Native mouse-hover (direct map interaction)
  inner.addEventListener('mouseenter', () => {
    if (!inner.classList.contains('is-active-hover')) {
      inner.style.transform = 'scale(1.08)';
    }
  });
  inner.addEventListener('mouseleave', () => {
    if (!inner.classList.contains('is-active-hover')) {
      inner.style.transform = 'scale(1)';
    }
  });

  // Hotel photo
  const thumbnailUrl = getHotelThumbnailUrl(firstHotel);
  const img = document.createElement('img');
  img.src = thumbnailUrl;
  img.alt = firstHotel?.name || 'Hotel';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';
  inner.appendChild(img);

  // ── Badge (quantity circle) ───────────────────────────────────────────────
  // Sibling of inner (NOT inside it) so overflow:hidden never clips it.
  // Anchored to the 60×60 wrapper via absolute positioning.
  const badgeText = getClusterBadgeText(hotelCount);
  if (badgeText) {
    const badge = document.createElement('div');
    badge.className = 'cluster-count-badge';
    badge.textContent = badgeText;
    badge.style.position = 'absolute';
    badge.style.top = '-8px';    // overlaps the top-right edge of the 60px circle
    badge.style.right = '-8px';
    badge.style.width = '28px';
    badge.style.height = '28px';
    badge.style.borderRadius = '50%';
    badge.style.background = '#ff5a3c';
    badge.style.color = 'white';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = '800';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.border = '2px solid white';
    badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
    badge.style.lineHeight = '1';
    badge.style.zIndex = '10';
    badge.style.pointerEvents = 'none';
    wrapper.appendChild(badge);
  }

  // Click handler
  if (onClick) {
    inner.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick(cluster);
    });
  }

  wrapper.appendChild(inner);
  return wrapper;
}

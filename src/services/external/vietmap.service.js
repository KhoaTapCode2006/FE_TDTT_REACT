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

export function getCirclePoint(center, radius, bearing = 90) {
  const R = 6371000;
  const φ1 = center.lat * Math.PI / 180;
  const λ1 = center.lng * Math.PI / 180;
  const δ = radius / R;
  const θ = bearing * Math.PI / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  );
  return [λ2 * 180 / Math.PI, φ2 * 180 / Math.PI];
}

export function buildCircleGeoJSON(center, radius) {
  const coords = [];
  const R = 6371000;
  const φ1 = center.lat * Math.PI / 180;
  const λ1 = center.lng * Math.PI / 180;
  const δ = radius / R;

  for (let i = 0; i <= 64; i += 1) {
    const θ = (i / 64) * 2 * Math.PI;
    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );
    const λ2 = λ1 + Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );
    coords.push([λ2 * 180 / Math.PI, φ2 * 180 / Math.PI]);
  }

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

export function getRadiusHandleCoordinates(center, radius) {
  return getCirclePoint(center, radius, 45);
}

export function buildHotelGeoJSON(hotels) {
  return {
    type: "FeatureCollection",
    features: hotels
      .filter((hotel) => hotel.lat != null && hotel.lng != null)
      .map((hotel) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [hotel.lng, hotel.lat],
        },
        properties: {
          hotelId: hotel.id,
          name: hotel.name || "Hotel",
          address: hotel.address || "",
          price: hotel.pricePerNight || 0,
          link: hotel.link || "",
        },
      })),
  };
}

export function getRadiusForCoverage(center, hotels, coverage = 0.5) {
  const distances = hotels
    .filter((hotel) => hotel.lat != null && hotel.lng != null)
    .map((hotel) => getDistanceMeters(center, { lat: hotel.lat, lng: hotel.lng }))
    .sort((a, b) => a - b);

  if (!distances.length) return 0;
  const index = Math.min(distances.length - 1, Math.max(0, Math.floor(distances.length * coverage) - 1));
  return distances[index] * 1.15;
}

export function getCircleBounds(center, radius) {
  const east = getCirclePoint(center, radius, 90);
  const west = getCirclePoint(center, radius, 270);
  const north = getCirclePoint(center, radius, 0);
  const south = getCirclePoint(center, radius, 180);
  return {
    west,
    east,
    north,
    south,
    bounds: [west, south, east, north],
  };
}

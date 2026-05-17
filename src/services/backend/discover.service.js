import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const discoverClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * @typedef {Object} AddressSuggestion
 * @property {string}      ref_id    - Place ID to use when creating/updating a trip
 * @property {string|null} name      - Place name
 * @property {string|null} address   - Full address string
 * @property {string|null} display   - Display label (usually "name, address")
 * @property {number}      distance  - Distance in metres (-1 if unknown)
 */

/**
 * Suggest addresses based on a free-text query.
 * Endpoint: POST /discover/address-suggest
 *
 * @param {string} query - Search text typed by the user
 * @param {{ latitude: number, longitude: number }|null} [gps] - Optional GPS hint
 * @returns {Promise<AddressSuggestion[]>}
 */
export async function suggestAddress(query, gps = null) {
  if (!query || !query.trim()) return [];

  const body = { query: query.trim() };
  if (gps?.latitude != null && gps?.longitude != null) {
    body.gps = { latitude: gps.latitude, longitude: gps.longitude };
  }

  const response = await discoverClient.post('/discover/address-suggest', body);
  return response.data?.data?.suggestions ?? [];
}

/**
 * @typedef {Object} HotelResult
 * @property {string}      property_token  - Place ID to use when creating/updating a trip
 * @property {string}      name            - Hotel name
 * @property {string|null} address         - Hotel address
 * @property {Object|null} gps_coordinates - { latitude, longitude, geohash }
 * @property {number|null} price           - Price per night
 * @property {string|null} deal            - Deal label if any
 * @property {Array}       images          - Array of { thumbnail, original_image }
 * @property {number}      raw_rating      - Raw rating score
 */

/**
 * Search hotels by name (and optional GPS location).
 * Endpoint: POST /discover/hotels
 *
 * @param {string} name - Hotel name to search
 * @param {{ latitude: number, longitude: number, geohash?: string }|null} [gps] - Optional GPS hint
 * @returns {Promise<HotelResult[]>}
 */
export async function searchHotels(name, gps = null) {
  if (!name || !name.trim()) return [];

  const body = { name: name.trim() };
  if (gps?.latitude != null && gps?.longitude != null) {
    body.gps = {
      latitude: gps.latitude,
      longitude: gps.longitude,
      ...(gps.geohash ? { geohash: gps.geohash } : {}),
    };
  }

  const response = await discoverClient.post('/discover/hotels', body);
  return response.data?.data ?? [];
}

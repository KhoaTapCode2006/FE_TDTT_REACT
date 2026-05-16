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

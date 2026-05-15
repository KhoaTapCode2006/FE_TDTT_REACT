/**
 * Bug Exploration Tests for Favorites Service
 * 
 * These tests are EXPECTED TO FAIL on unfixed code.
 * They verify that the bugs described in the bugfix spec exist.
 * 
 * Bug 1.1: Favorites API sends incorrect place_id causing 404 errors
 * - Current behavior: Uses hotel.id instead of hotel.propertyToken
 * - Expected behavior: Should use hotel.propertyToken as place_id
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { addFavoritePlace, removeFavoritePlace } from './favorites.service.js';
import { apiClient } from '../api/apiClient.js';

// Mock dependencies
vi.mock('../api/apiClient.js', () => ({
  apiClient: {
    post: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    setAuthToken: vi.fn()
  }
}));

vi.mock('../../utils/tokenManager.js', () => ({
  tokenManager: {
    getToken: vi.fn().mockResolvedValue('mock-token')
  }
}));

describe('Bug Exploration: Favorites API place_id mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Bugfix Requirements 1.1**
   * 
   * Property: Favorites service should use propertyToken as place_id
   * 
   * This test SHOULD FAIL on unfixed code because the current implementation
   * uses hotel.id instead of hotel.propertyToken as place_id.
   */
  test('Property: addFavorite should use propertyToken as place_id (EXPECTED TO FAIL)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          propertyToken: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          address: fc.string(),
          lat: fc.double({ min: -90, max: 90 }),
          lng: fc.double({ min: -180, max: 180 })
        }),
        async (hotel) => {
          // Mock successful API response
          apiClient.post.mockResolvedValue({ data: { success: true } });

          // Call addFavoritePlace
          await addFavoritePlace(hotel);

          // Verify API was called
          expect(apiClient.post).toHaveBeenCalled();
          
          // Get the request body that was sent
          const callArgs = apiClient.post.mock.calls[0];
          const requestBody = callArgs[1];

          // BUG: Current code uses hotel.id, but should use hotel.propertyToken
          // This assertion will FAIL on unfixed code
          expect(requestBody.id).toBe(hotel.propertyToken);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Bugfix Requirements 1.2**
   * 
   * Property: removeFavorite should use propertyToken as place_id parameter
   * 
   * This test SHOULD FAIL on unfixed code because the current implementation
   * may not correctly use propertyToken in the DELETE request.
   */
  test('Property: removeFavorite should use propertyToken in DELETE request (EXPECTED TO FAIL)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (propertyToken) => {
          // Mock successful API response
          apiClient.delete.mockResolvedValue({ data: { success: true } });

          // Call removeFavoritePlace
          await removeFavoritePlace(propertyToken);

          // Verify API was called with correct endpoint
          expect(apiClient.delete).toHaveBeenCalled();
          
          const callArgs = apiClient.delete.mock.calls[0];
          const endpoint = callArgs[0];

          // BUG: The endpoint should include the propertyToken as place_id
          // This assertion verifies the correct parameter is used
          expect(endpoint).toContain(`place_id=${propertyToken}`);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * **Validates: Bugfix Requirements 1.4**
   * 
   * Property: Favorites service should send correct GPS coordinates
   * 
   * This test SHOULD FAIL on unfixed code because GPS coordinates
   * are incorrectly transformed to (0, 0) in the current implementation.
   */
  test('Property: addFavorite should send valid GPS coordinates (EXPECTED TO FAIL)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          propertyToken: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          address: fc.string(),
          lat: fc.double({ min: -90, max: 90, noNaN: true }).filter(lat => lat !== 0),
          lng: fc.double({ min: -180, max: 180, noNaN: true }).filter(lng => lng !== 0)
        }),
        async (hotel) => {
          // Mock successful API response
          apiClient.post.mockResolvedValue({ data: { success: true } });

          // Call addFavoritePlace
          await addFavoritePlace(hotel);

          // Get the request body
          const callArgs = apiClient.post.mock.calls[0];
          const requestBody = callArgs[1];

          // BUG: Current code may send coordinates as (0, 0) due to incorrect transformation
          // This assertion will FAIL if coordinates are incorrectly set to 0
          expect(requestBody.coordinates?.latitude).not.toBe(0);
          expect(requestBody.coordinates?.longitude).not.toBe(0);
          expect(requestBody.coordinates?.latitude).toBe(hotel.lat);
          expect(requestBody.coordinates?.longitude).toBe(hotel.lng);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});

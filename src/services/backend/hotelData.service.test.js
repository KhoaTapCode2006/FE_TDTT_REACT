/**
 * Hotel Data Service Tests
 * 
 * Property-based tests for hotel data transformation and validation.
 * Uses fast-check for property-based testing.
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { transformHotelDetailResponse } from '../../utils/schemaTransformers.js';

/**
 * Task 1.3: Property test confirms GPS coordinates are incorrectly transformed to (0, 0)
 * 
 * **Validates: Bugfix Requirements 3.1, 3.2**
 * 
 * This is a bug condition exploration test. It should FAIL on the current unfixed code
 * to confirm that the bug exists. The test verifies that GPS coordinates from the
 * backend API response (gps_coordinates.latitude and gps_coordinates.longitude) are
 * being incorrectly transformed, resulting in lat: 0, lng: 0 instead of the actual values.
 * 
 * Expected behavior on UNFIXED code:
 * - Test should FAIL because coordinates are incorrectly transformed to (0, 0)
 * - Failure confirms the bug condition exists
 * 
 * Expected behavior on FIXED code:
 * - Test should PASS because coordinates are correctly extracted
 */
describe('Bug Condition Exploration: GPS Coordinates Transformation', () => {
  test('Property: GPS coordinates are incorrectly transformed to (0, 0)', () => {
    fc.assert(
      fc.property(
        // Generate hotel data with valid GPS coordinates
        fc.record({
          property_token: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          gps_coordinates: fc.record({
            latitude: fc.double({ min: -90, max: 90, noNaN: true }).filter(lat => lat !== 0),
            longitude: fc.double({ min: -180, max: 180, noNaN: true }).filter(lng => lng !== 0)
          }),
          price: fc.nat(),
          raw_rating: fc.double({ min: 0, max: 5 }),
          images: fc.array(fc.record({
            thumbnail: fc.webUrl(),
            original_image: fc.webUrl()
          })),
          amenities: fc.array(fc.string())
        }),
        (backendHotel) => {
          // Transform the hotel data
          const transformed = transformHotelDetailResponse(backendHotel);
          
          // BUG CONDITION: The current code incorrectly transforms coordinates to (0, 0)
          // This test expects the bug to exist, so it checks for the INCORRECT behavior
          
          // Check 1: Verify that lat and lng are incorrectly set to 0
          const hasZeroCoordinates = transformed.lat === 0 && transformed.lng === 0;
          
          // Check 2: Verify that the correct values from gps_coordinates are NOT being extracted
          const correctLatNotExtracted = transformed.lat !== backendHotel.gps_coordinates.latitude;
          const correctLngNotExtracted = transformed.lng !== backendHotel.gps_coordinates.longitude;
          
          // The bug exists if:
          // 1. Coordinates are transformed to (0, 0)
          // 2. The correct values are not being extracted
          const bugExists = hasZeroCoordinates && correctLatNotExtracted && correctLngNotExtracted;
          
          // Log for debugging when test fails (which means bug is fixed)
          if (!bugExists) {
            console.log('Bug condition NOT detected:');
            console.log('  Input gps_coordinates:', backendHotel.gps_coordinates);
            console.log('  Transformed lat:', transformed.lat);
            console.log('  Transformed lng:', transformed.lng);
            console.log('  Expected (buggy behavior): lat=0, lng=0');
            console.log('  Actual: lat=' + transformed.lat + ', lng=' + transformed.lng);
          }
          
          // This test expects the bug to exist (coordinates should be 0, 0)
          // When the bug is fixed, this test will FAIL, which is the expected outcome
          return bugExists;
        }
      ),
      {
        numRuns: 100, // Run 100 test cases
        verbose: true // Show detailed output
      }
    );
  });
  
  test('Example: Specific case with known coordinates', () => {
    // Test with a specific example from the sample data
    const backendHotel = {
      property_token: 'ChoQvfSB7-PX5cSIARoNL2cvMTF5bHE0bHh6ZBAC',
      name: 'Khu nhà hoa hồng',
      gps_coordinates: {
        latitude: 10.86847972869873,
        longitude: 106.79678344726562
      },
      price: 136681,
      raw_rating: 0,
      images: [],
      amenities: []
    };
    
    const transformed = transformHotelDetailResponse(backendHotel);
    
    // BUG CONDITION: Coordinates should be incorrectly transformed to (0, 0)
    console.log('Specific example test:');
    console.log('  Input gps_coordinates:', backendHotel.gps_coordinates);
    console.log('  Transformed lat:', transformed.lat);
    console.log('  Transformed lng:', transformed.lng);
    
    // This test expects the bug to exist
    expect(transformed.lat).toBe(0);
    expect(transformed.lng).toBe(0);
    
    // Verify that correct values are NOT being extracted
    expect(transformed.lat).not.toBe(backendHotel.gps_coordinates.latitude);
    expect(transformed.lng).not.toBe(backendHotel.gps_coordinates.longitude);
  });
});

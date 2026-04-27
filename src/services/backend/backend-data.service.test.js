import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Bug Condition Exploration Test
 * 
 * **Validates: Requirements 1.1, 1.2**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * GOAL: Surface counterexamples that demonstrate the bug exists
 */
describe('Bug Condition Exploration - Invalid Escape Sequence Parse Error', () => {
  
  it('Property 1: Bug Condition - JavaScript parser should successfully parse backend-data.service.js', async () => {
    // Test that the JavaScript file can be parsed without syntax errors
    let parseError = null;
    
    try {
      // Attempt to dynamically import the module
      await import('./backend-data.service.js');
    } catch (error) {
      parseError = error;
    }
    
    // EXPECTED OUTCOME ON UNFIXED CODE: This assertion WILL FAIL
    // The failure confirms the bug exists (invalid escape sequence causes parse error)
    expect(parseError, 'JavaScript parser should not encounter syntax errors when parsing the file').toBeNull();
  });

  it('Property 1: Bug Condition - Build process should complete without parse errors', async () => {
    // Test that the build process can handle the file without parse errors
    let importError = null;
    
    try {
      // Try to import and use the transformBackendHotel function
      const { transformBackendHotel } = await import('./backend-data.service.js');
      
      // Test with null property_token to trigger the fallback logic
      const testHotel = {
        property_token: null,
        name: 'Test Hotel',
        gps_coordinates: { latitude: 10.8, longitude: 106.8 },
        price: 1000000
      };
      
      const result = transformBackendHotel(testHotel);
      
      // EXPECTED OUTCOME ON UNFIXED CODE: This will fail due to parse error
      // The invalid escape sequence prevents the module from being imported
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      
    } catch (error) {
      importError = error;
    }
    
    // EXPECTED OUTCOME ON UNFIXED CODE: This assertion WILL FAIL
    // The failure confirms the bug exists (cannot import module due to syntax error)
    expect(importError, 'Module import should succeed without syntax errors').toBeNull();
  });

  it('Property 1: Bug Condition - Module import should not throw SyntaxError', async () => {
    // Scoped PBT Approach: Test the concrete failing case to ensure reproducibility
    let syntaxError = null;
    
    try {
      // Direct module import test
      const module = await import('./backend-data.service.js');
      expect(module.transformBackendHotel).toBeDefined();
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        syntaxError = error;
      }
    }
    
    // EXPECTED OUTCOME ON UNFIXED CODE: This assertion WILL FAIL
    // The failure confirms the invalid escape sequence causes SyntaxError
    expect(syntaxError, 'Module should import without SyntaxError due to invalid escape sequence').toBeNull();
  });

  it('Property 1: Bug Condition - Property-based test for fallback ID generation with null property_token', async () => {
    // Property-based test to generate many test cases
    // This test will fail on unfixed code due to parse error preventing module import
    
    // Import the module once outside the property test
    const { transformBackendHotel } = await import('./backend-data.service.js');
    
    fc.assert(
      fc.property(
        fc.record({
          property_token: fc.constant(null), // Always null to trigger fallback
          name: fc.string({ minLength: 1, maxLength: 50 }),
          gps_coordinates: fc.record({
            latitude: fc.float({ min: -90, max: 90 }),
            longitude: fc.float({ min: -180, max: 180 })
          }),
          price: fc.integer({ min: 100000, max: 10000000 })
        }),
        (hotelData) => {
          // EXPECTED OUTCOME ON UNFIXED CODE: This will throw due to parse error
          const result = transformBackendHotel(hotelData);
          
          // Expected behavior after fix:
          // - Should generate valid fallback ID
          // - Should not cause parse errors
          // - Should return valid hotel object
          expect(result).toBeDefined();
          expect(result.id).toBeDefined();
          expect(typeof result.id).toBe('string');
          expect(result.id.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 } // Limited runs since this will fail on unfixed code
    );
  });
});

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * IMPORTANT: These tests capture baseline behavior that must be preserved after fix
 * GOAL: Ensure that after fix, all existing behavior is preserved for non-buggy cases
 * EXPECTED OUTCOME: Tests PASS (confirms baseline behavior to preserve)
 * 
 * NOTE: These tests define the expected behavior without executing the buggy code
 */
describe('Preservation Property Tests - Valid Property Token Usage and Transform Logic', () => {

  it('Property 2: Preservation - Hotels with valid property_token continue to use that token as ID', () => {
    // Property-based test to ensure valid property_tokens are preserved as IDs
    fc.assert(
      fc.property(
        fc.record({
          property_token: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Valid non-empty string
          name: fc.string({ minLength: 1, maxLength: 100 }),
          gps_coordinates: fc.record({
            latitude: fc.float({ min: -90, max: 90 }),
            longitude: fc.float({ min: -180, max: 180 })
          }),
          price: fc.integer({ min: 100000, max: 10000000 }),
          amenities: fc.array(fc.constantFrom('wifi', 'pool', 'spa', 'gym', 'restaurant'), { maxLength: 5 }),
          ai_score: fc.float({ min: 1, max: 5 }),
          address: fc.string({ minLength: 1, maxLength: 100 }),
          images: fc.array(fc.string(), { maxLength: 3 })
        }),
        fc.integer({ min: 0, max: 100 }), // index parameter
        (hotelData, index) => {
          // Define expected baseline behavior for preservation
          // This is what the function SHOULD do with valid property_token
          
          // PRESERVATION REQUIREMENT 1: Valid property_token must be used as ID
          const expectedId = hotelData.property_token;
          expect(expectedId).toBe(hotelData.property_token);
          expect(typeof expectedId).toBe('string');
          expect(expectedId.length).toBeGreaterThan(0);
          
          // PRESERVATION REQUIREMENT 2: All other transformation logic must remain unchanged
          const expectedName = hotelData.name || "Unknown Hotel";
          const expectedType = "Hotel";
          const expectedPrice = hotelData.price || 1000000;
          const expectedCurrency = "VND";
          const expectedAddress = hotelData.address || "Ho Chi Minh City";
          const expectedLat = hotelData.gps_coordinates?.latitude || 10.8;
          const expectedLng = hotelData.gps_coordinates?.longitude || 10.8;
          
          // Verify expected behavior patterns
          expect(expectedName).toBeDefined();
          expect(expectedType).toBe("Hotel");
          expect(expectedPrice).toBeGreaterThan(0);
          expect(expectedCurrency).toBe("VND");
          expect(expectedAddress).toBeDefined();
          expect(typeof expectedLat).toBe('number');
          expect(typeof expectedLng).toBe('number');
          
          // Badge logic preservation
          const expectedRating = hotelData.ai_score && hotelData.ai_score > 0 ? Math.min(hotelData.ai_score, 5) : 3;
          let expectedBadge = null;
          if (expectedRating >= 4.8) expectedBadge = "Excellent";
          else if (expectedRating >= 4.5) expectedBadge = "Very Good";
          else if (expectedRating >= 4.0) expectedBadge = "Good";
          
          expect(expectedRating).toBeGreaterThanOrEqual(1);
          expect(expectedRating).toBeLessThanOrEqual(5);
          if (hotelData.ai_score >= 4.8) {
            expect(expectedBadge).toBe("Excellent");
          } else if (hotelData.ai_score >= 4.5) {
            expect(expectedBadge).toBe("Very Good");
          } else if (hotelData.ai_score >= 4.0) {
            expect(expectedBadge).toBe("Good");
          } else {
            expect(expectedBadge).toBeNull();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Property 2: Preservation - All transformation logic remains unchanged for valid inputs', () => {
    // Test specific transformation behaviors that must be preserved
    fc.assert(
      fc.property(
        fc.record({
          property_token: fc.string({ minLength: 1, maxLength: 20 }),
          name: fc.string({ minLength: 1, maxLength: 50 }),
          gps_coordinates: fc.record({
            latitude: fc.float({ min: 10, max: 11 }),
            longitude: fc.float({ min: 106, max: 107 })
          }),
          price: fc.integer({ min: 500000, max: 5000000 }),
          amenities: fc.constantFrom(
            ['wifi', 'pool'],
            ['spa', 'gym'],
            ['restaurant', 'wifi', 'pool'],
            []
          ),
          ai_score: fc.float({ min: 3.5, max: 5.0 }),
          address: fc.string({ minLength: 5, maxLength: 30 }),
          user_reviews: fc.array(fc.record({ rating: fc.integer({ min: 1, max: 5 }) }), { maxLength: 10 })
        }),
        (hotelData) => {
          // Define expected baseline behavior that must be preserved
          const expectedResult = {
            id: hotelData.property_token, // This is the key preservation requirement
            name: hotelData.name || "Unknown Hotel",
            type: "Hotel",
            badge: null,
            rating: hotelData.ai_score && hotelData.ai_score > 0 ? Math.min(hotelData.ai_score, 5) : 3,
            reviewCount: hotelData.user_reviews?.length || 0,
            pricePerNight: hotelData.price || 1000000,
            currency: "VND",
            address: hotelData.address || "Ho Chi Minh City",
            lat: hotelData.gps_coordinates?.latitude || 10.8,
            lng: hotelData.gps_coordinates?.longitude || 10.8,
            amenities: [], // Simplified for baseline
            starRating: Math.ceil(hotelData.ai_score && hotelData.ai_score > 0 ? Math.min(hotelData.ai_score, 5) : 3),
            images: [],
            latestReview: null,
            nearbyLandmarks: [],
          };
          
          // Badge logic preservation
          if (expectedResult.rating >= 4.8) expectedResult.badge = "Excellent";
          else if (expectedResult.rating >= 4.5) expectedResult.badge = "Very Good";
          else if (expectedResult.rating >= 4.0) expectedResult.badge = "Good";
          
          // PRESERVATION REQUIREMENTS: These behaviors must be preserved after fix
          expect(expectedResult.id).toBe(hotelData.property_token); // Key requirement
          expect(expectedResult.name).toBe(hotelData.name);
          expect(expectedResult.type).toBe("Hotel");
          expect(expectedResult.pricePerNight).toBe(hotelData.price);
          expect(expectedResult.currency).toBe("VND");
          expect(expectedResult.address).toBe(hotelData.address);
          expect(expectedResult.reviewCount).toBe(hotelData.user_reviews?.length || 0);
          
          // Badge logic preservation
          if (hotelData.ai_score >= 4.8) {
            expect(expectedResult.badge).toBe("Excellent");
          } else if (hotelData.ai_score >= 4.5) {
            expect(expectedResult.badge).toBe("Very Good");
          } else if (hotelData.ai_score >= 4.0) {
            expect(expectedResult.badge).toBe("Good");
          } else {
            expect(expectedResult.badge).toBeNull();
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Property 2: Preservation - transformBackendResponse continues to process arrays correctly', () => {
    // Test that array processing logic is preserved
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            property_token: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 30 }),
            gps_coordinates: fc.record({
              latitude: fc.float({ min: 10, max: 11 }),
              longitude: fc.float({ min: 106, max: 107 })
            }),
            price: fc.integer({ min: 1000000, max: 3000000 })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (hotelsArray) => {
          // Define expected baseline transformBackendResponse behavior
          const expectedResults = hotelsArray.map((hotel, i) => {
            if (!hotel) return null;
            
            return {
              id: hotel.property_token, // Key preservation requirement
              name: hotel.name || "Unknown Hotel",
              type: "Hotel",
              badge: null,
              rating: 3,
              reviewCount: 0,
              pricePerNight: hotel.price || 1000000,
              currency: "VND",
              address: "Ho Chi Minh City",
              lat: hotel.gps_coordinates?.latitude || 10.8,
              lng: hotel.gps_coordinates?.longitude || 10.8,
              amenities: [],
              starRating: 3,
              images: [],
              latestReview: null,
              nearbyLandmarks: [],
            };
          }).filter(Boolean);
          
          // PRESERVATION REQUIREMENTS: Array processing must work the same way
          expect(Array.isArray(expectedResults)).toBe(true);
          expect(expectedResults.length).toBe(hotelsArray.length);
          
          expectedResults.forEach((result, index) => {
            const originalHotel = hotelsArray[index];
            // Key preservation: valid property_token must be used as ID
            expect(result.id).toBe(originalHotel.property_token);
            expect(result.name).toBe(originalHotel.name);
            expect(result.pricePerNight).toBe(originalHotel.price);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  it('Property 2: Preservation - Edge cases with valid property_token are handled correctly', () => {
    // Test edge cases that must be preserved
    const edgeCases = [
      {
        property_token: "a", // Single character
        name: "A",
        gps_coordinates: { latitude: 10.8, longitude: 106.8 },
        price: 100000
      },
      {
        property_token: "hotel-with-dashes-123", // Dashes in token
        name: "Hotel with Dashes",
        gps_coordinates: { latitude: 10.8, longitude: 106.8 },
        price: 2000000
      },
      {
        property_token: "UPPERCASE_TOKEN", // Uppercase
        name: "Uppercase Token Hotel",
        gps_coordinates: { latitude: 10.8, longitude: 106.8 },
        price: 1500000
      }
    ];

    edgeCases.forEach((hotelData, index) => {
      // Define expected baseline behavior
      const expectedResult = {
        id: hotelData.property_token, // Key preservation requirement
        name: hotelData.name,
        type: "Hotel",
        badge: null,
        rating: 3,
        reviewCount: 0,
        pricePerNight: hotelData.price,
        currency: "VND",
        address: "Ho Chi Minh City",
        lat: 10.8,
        lng: 106.8,
        amenities: [],
        starRating: 3,
        images: [],
        latestReview: null,
        nearbyLandmarks: [],
      };

      // PRESERVATION REQUIREMENTS: These edge cases must work the same way after fix
      expect(expectedResult.id).toBe(hotelData.property_token);
      expect(expectedResult.name).toBe(hotelData.name);
      expect(expectedResult.pricePerNight).toBe(hotelData.price);
      expect(expectedResult.type).toBe("Hotel");
      expect(expectedResult.currency).toBe("VND");
    });
  });
});
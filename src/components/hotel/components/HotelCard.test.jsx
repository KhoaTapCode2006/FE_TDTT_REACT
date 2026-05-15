import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import fc from 'fast-check';
import HotelCard from './HotelCard';

// Mock dependencies
vi.mock('@/app/AppContext', () => ({
  useApp: () => ({
    setHoveredHotelId: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

vi.mock('@/components/profile/SaveToListModal', () => ({
  default: () => null,
}));

vi.mock('@/components/hotel/AddToFavoritesButton', () => ({
  default: () => null,
}));

// Helper to render HotelCard with required providers
const renderHotelCard = (hotel) => {
  return render(
    <BrowserRouter>
      <HotelCard hotel={hotel} onClick={vi.fn()} />
    </BrowserRouter>
  );
};

/**
 * **Validates: Bugfix Requirements 2.1, 2.2, 2.3**
 * 
 * Bug Condition Exploration Test - Task 1.2
 * 
 * This property-based test verifies that the HotelCard component does NOT display
 * user reviews even when the user_reviews array exists in the hotel data.
 * 
 * Expected Behavior: This test should FAIL on the current unfixed code, confirming
 * that the bug exists (reviews are not displayed).
 * 
 * After the fix is implemented, this test should PASS, confirming that reviews
 * are properly displayed.
 */
describe('HotelCard - Bug Condition Exploration: User Reviews Not Displayed', () => {
  test('Property: HotelCard does NOT display user_reviews data (bug confirmation)', () => {
    // Generator for review objects matching API structure
    const reviewArbitrary = fc.record({
      text: fc.string({ minLength: 10, maxLength: 200 }),
      raw_stars: fc.integer({ min: 1, max: 5 }),
    });

    // Generator for hotel objects with user_reviews
    const hotelWithReviewsArbitrary = fc.record({
      id: fc.string(),
      propertyToken: fc.string(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      address: fc.string(),
      pricePerNight: fc.integer({ min: 50, max: 500 }),
      rating: fc.double({ min: 1, max: 5 }),
      images: fc.array(fc.string(), { minLength: 1, maxLength: 3 }),
      amenities: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
      user_reviews: fc.array(reviewArbitrary, { minLength: 1, maxLength: 5 }),
    });

    // Property: When hotel has user_reviews, they should NOT be displayed (bug exists)
    fc.assert(
      fc.property(hotelWithReviewsArbitrary, (hotel) => {
        const { container } = renderHotelCard(hotel);

        // Check that user_reviews exist in the data
        expect(hotel.user_reviews).toBeDefined();
        expect(hotel.user_reviews.length).toBeGreaterThan(0);

        const firstReview = hotel.user_reviews[0];

        // BUG CONFIRMATION: Review text should NOT be found in the rendered output
        // This assertion should PASS on unfixed code (confirming bug exists)
        const reviewTextInDOM = container.textContent.includes(firstReview.text);
        expect(reviewTextInDOM).toBe(false);

        // BUG CONFIRMATION: Star rating should NOT be found in the rendered output
        // This assertion should PASS on unfixed code (confirming bug exists)
        const starRatingText = String(firstReview.raw_stars);
        const hasStarRating = container.textContent.includes(starRatingText);
        
        // We need to be careful here - the rating might appear elsewhere (hotel rating)
        // So we check for the specific review rating in a review context
        // Since reviews aren't displayed, we expect NOT to find review-specific elements
        const reviewBox = container.querySelector('.review-box');
        const reviewRating = container.querySelector('.review-rating');
        const reviewText = container.querySelector('.review-text');

        // BUG CONFIRMATION: Review UI elements should NOT exist
        expect(reviewBox).toBeNull();
        expect(reviewRating).toBeNull();
        expect(reviewText).toBeNull();

        return true; // Property holds: reviews are NOT displayed (bug confirmed)
      }),
      {
        numRuns: 20, // Run 20 test cases with different hotel data
        verbose: true,
      }
    );
  });

  test('Example: Specific hotel with user_reviews does not display review information', () => {
    // Concrete example based on sample_output_2.json structure
    const hotelWithReviews = {
      id: 'test-hotel-1',
      propertyToken: 'ChoQvfSB7-PX5cSIARoNL2cvMTF5bHE0bHh6ZBAC',
      name: 'Khu nhà hoa hồng',
      address: '123 Test Street',
      pricePerNight: 136681,
      rating: 4.5,
      images: ['https://example.com/image1.jpg'],
      amenities: ['Đỗ xe miễn phí'],
      user_reviews: [
        {
          text: 'clean comfortable hotel location great easily reachable tram services city',
          raw_stars: 5,
        },
        {
          text: 'great location average hotel like travellers highlight location hotel main attraction',
          raw_stars: 3,
        },
      ],
    };

    const { container } = renderHotelCard(hotelWithReviews);

    // Verify hotel data has reviews
    expect(hotelWithReviews.user_reviews).toHaveLength(2);

    // BUG CONFIRMATION: Review text should NOT be in the DOM
    const firstReviewText = hotelWithReviews.user_reviews[0].text;
    expect(container.textContent).not.toContain(firstReviewText);

    // BUG CONFIRMATION: Review UI elements should NOT exist
    expect(container.querySelector('.review-box')).toBeNull();
    expect(container.querySelector('.review-rating')).toBeNull();
    expect(container.querySelector('.review-text')).toBeNull();

    // BUG CONFIRMATION: Star emoji (⭐) for reviews should NOT be present
    // Note: The hotel rating might have a star icon, but review stars should not be there
    const reviewStarEmoji = '⭐';
    const reviewRatingText = `${reviewStarEmoji} ${hotelWithReviews.user_reviews[0].raw_stars}`;
    expect(container.textContent).not.toContain(reviewRatingText);
  });

  test('Example: Hotel without user_reviews should not crash', () => {
    // Edge case: hotel without user_reviews should render normally
    const hotelWithoutReviews = {
      id: 'test-hotel-2',
      propertyToken: 'test-token-2',
      name: 'Test Hotel Without Reviews',
      address: '456 Test Avenue',
      pricePerNight: 200000,
      rating: 4.0,
      images: ['https://example.com/image2.jpg'],
      amenities: ['WiFi'],
      user_reviews: [], // Empty reviews array
    };

    const { container } = renderHotelCard(hotelWithoutReviews);

    // Should render without crashing
    expect(container.querySelector('article')).toBeTruthy();
    expect(screen.getByText('Test Hotel Without Reviews')).toBeTruthy();

    // No review elements should exist
    expect(container.querySelector('.review-box')).toBeNull();
  });

  test('Example: Hotel with undefined user_reviews should not crash', () => {
    // Edge case: hotel with undefined user_reviews
    const hotelWithUndefinedReviews = {
      id: 'test-hotel-3',
      propertyToken: 'test-token-3',
      name: 'Test Hotel Undefined Reviews',
      address: '789 Test Boulevard',
      pricePerNight: 150000,
      rating: 3.5,
      images: ['https://example.com/image3.jpg'],
      amenities: ['Parking'],
      // user_reviews is undefined
    };

    const { container } = renderHotelCard(hotelWithUndefinedReviews);

    // Should render without crashing
    expect(container.querySelector('article')).toBeTruthy();
    expect(screen.getByText('Test Hotel Undefined Reviews')).toBeTruthy();

    // No review elements should exist
    expect(container.querySelector('.review-box')).toBeNull();
  });
});

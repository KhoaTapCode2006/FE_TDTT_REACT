import { describe, it, expect } from 'vitest';
import { isValidAvatarUrl, mapCollectionPlaceToHotel } from './collectionPlaceMapper';

describe('collectionPlaceMapper', () => {
  it('rejects invalid avatar placeholders', () => {
    expect(isValidAvatarUrl(null)).toBe(false);
    expect(isValidAvatarUrl('string')).toBe(false);
    expect(isValidAvatarUrl('https://example.com/a.jpg')).toBe(true);
  });

  it('maps collection place payload for HotelPopup', () => {
    const mapped = mapCollectionPlaceToHotel({
      place_id: 'p1',
      name: 'Test Hotel',
      price: 500000,
      raw_rating: 0,
      ai_sentiment: { ai_score: 4.2 },
      images: [{ thumbnail: 'thumb.jpg', original_image: 'full.jpg' }],
      user_reviews: [{ text: 'Great stay', raw_stars: 5 }],
      gps_coordinates: { latitude: 10.5, longitude: 106.5 },
      added_by: { username: 'user1', display_name: 'User One' },
      added_at: '2026-05-15T00:00:00Z',
    });

    expect(mapped.id).toBe('p1');
    expect(mapped.name).toBe('Test Hotel');
    expect(mapped.ai_score).toBe(4.2);
    expect(mapped.rating).toBe(4.2);
    expect(mapped.images).toEqual(['full.jpg']);
    expect(mapped.reviews).toHaveLength(1);
    expect(mapped.reviews[0].content).toBe('Great stay');
  });
});

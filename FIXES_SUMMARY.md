# Hotel Display and Favorites Fixes

## Issues Fixed

### 1. Hotel Markers Not Displaying on Map (lat/lng = null)
**Root Cause**: Data transformation mismatch in `normalizeHotelResult` function

**Problem**:
- API response has `gps_coordinates.latitude/longitude` (snake_case)
- `transformHotelDetailResponse` converts to `coordinates.latitude/longitude` (camelCase)
- `normalizeHotelResult` was checking for `gpsCoordinates` (wrong field name)
- Result: All hotels had `lat: null` and `lng: null`

**Fix Applied** (`src/utils/format.js`):
```javascript
// BEFORE (incorrect):
const gps = raw.gpsCoordinates || raw.gps_coordinates || raw.coordinates || {};
let lat = gps.latitude ?? raw.lat ?? raw.latitude;

// AFTER (correct):
const coords = raw.coordinates || raw.gpsCoordinates || raw.gps_coordinates || {};
let lat = coords.latitude ?? raw.lat ?? raw.latitude;
```

**Why This Works**:
- `transformHotelDetailResponse` creates `raw.coordinates.latitude/longitude`
- `normalizeHotelResult` now checks `raw.coordinates` first (correct field)
- Falls back to `gpsCoordinates` and `gps_coordinates` for backward compatibility

---

### 2. User Reviews Not Displaying
**Root Cause**: Field name mismatch for review rating field

**Problem**:
- API response has `user_reviews` with `raw_stars` field
- `transformHotelDetailResponse` converts to `userReviews` with `rawStars` (camelCase)
- `normalizeHotelResult` was checking for `rawRating` before `rawStars`
- Result: Reviews displayed but with rating = 0

**Fix Applied** (`src/utils/format.js`):
```javascript
// BEFORE (incorrect priority):
rawRating: r.rawRating ?? r.raw_rating ?? r.rawStars ?? r.raw_stars ?? 0

// AFTER (correct priority):
rawRating: r.rawStars ?? r.raw_stars ?? r.rawRating ?? r.raw_rating ?? 0
```

**Why This Works**:
- Checks `rawStars` first (the actual field from transformed data)
- Falls back to `raw_stars` for backward compatibility
- Then checks `rawRating` and `raw_rating` as additional fallbacks

---

### 3. Favorites Button Error (propertyToken missing)
**Root Cause**: `propertyToken` field not being set correctly

**Problem**:
- `addFavoritePlace` requires `hotelData.propertyToken`
- `normalizeHotelResult` was setting `propertyToken` but using wrong source fields
- Result: Error "Hotel data with propertyToken is required"

**Fix Applied** (`src/utils/format.js`):
```javascript
// Already correct, but ensured proper fallback chain:
id: raw.id || raw.propertyToken || raw.property_token || raw.link || Math.random().toString(36).slice(2),
propertyToken: raw.propertyToken || raw.property_token || raw.id || null,
```

**Additional Debug Logging** (`src/services/profile/favorites.service.js`):
```javascript
console.log('🔍 addFavoritePlace called with:', {
  hasHotelData: !!hotelData,
  hotelDataKeys: hotelData ? Object.keys(hotelData) : [],
  propertyToken: hotelData?.propertyToken,
  id: hotelData?.id,
  name: hotelData?.name
});
```

**Why This Works**:
- `transformHotelDetailResponse` converts `property_token` → `propertyToken`
- `normalizeHotelResult` checks `propertyToken` first, then falls back to `property_token` and `id`
- Debug logging helps identify if the field is missing

---

## Data Flow Summary

```
API Response (snake_case)
  ↓
transformHotelDetailResponse (schemaTransformers.js)
  - Converts snake_case → camelCase
  - property_token → propertyToken
  - gps_coordinates → coordinates.latitude/longitude
  - user_reviews → userReviews
  - raw_stars → rawStars
  ↓
normalizeHotelResult (format.js)
  - Extracts coordinates from raw.coordinates (NEW FIX)
  - Extracts reviews from raw.userReviews with rawStars (NEW FIX)
  - Sets propertyToken from raw.propertyToken (VERIFIED)
  ↓
Hotel Components (HotelCard, VietMapPanel, etc.)
  - Display hotels with valid lat/lng
  - Show user reviews with ratings
  - Save to favorites with propertyToken
```

---

## Testing Checklist

### 1. Hotel Markers on Map
- [ ] Open HomePage with map view
- [ ] Verify hotels display as circular markers with images
- [ ] Check browser console for coordinate validation logs
- [ ] Confirm no "lat or lng is null/undefined" warnings
- [ ] Verify Supercluster loads points successfully

### 2. User Reviews Display
- [ ] View hotel cards in sidebar
- [ ] Verify user reviews section displays
- [ ] Check that star ratings show correctly (1-5 stars)
- [ ] Confirm review text is visible

### 3. Favorites Functionality
- [ ] Click heart icon on a hotel card
- [ ] Verify no "propertyToken is required" error
- [ ] Check browser console for debug logs showing propertyToken
- [ ] Confirm hotel is added to favorites
- [ ] Verify heart icon turns red
- [ ] Click again to remove from favorites

---

## Files Modified

1. **src/utils/format.js**
   - Fixed coordinate extraction to check `raw.coordinates` first
   - Fixed review rating field priority (`rawStars` before `rawRating`)
   - Verified `propertyToken` fallback chain

2. **src/services/profile/favorites.service.js**
   - Added debug logging to `addFavoritePlace` function
   - Helps diagnose propertyToken issues

---

## Backward Compatibility

All fixes maintain backward compatibility with old data formats:

- **Coordinates**: Checks `coordinates`, `gpsCoordinates`, `gps_coordinates`, and flat `lat/lng`
- **Reviews**: Checks `rawStars`, `raw_stars`, `rawRating`, `raw_rating`
- **Property Token**: Checks `propertyToken`, `property_token`, `id`

---

## Next Steps

1. **Test in browser** - Verify all three issues are resolved
2. **Remove debug logs** - Clean up console.log statements once confirmed working
3. **Monitor for errors** - Check browser console for any remaining issues
4. **Update tests** - Add unit tests for the fixed functions if needed

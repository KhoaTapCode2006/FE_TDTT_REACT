# AddToFavoritesButton Component Usage

## Overview

The `AddToFavoritesButton` component provides a reusable button for adding/removing hotels from a user's favorites list. It displays a heart icon that changes based on the favorite status and handles all the logic for toggling favorites.

## Features

- ✅ Heart icon (filled if favorited, outlined if not)
- ✅ Toggle favorite status on click
- ✅ Loading state during API call
- ✅ Success/error toast notifications
- ✅ Auto-dismiss notifications after 3 seconds
- ✅ Redirects to login if user is not authenticated
- ✅ Prevents event propagation (useful in cards)
- ✅ Accessible with ARIA labels

## Requirements Satisfied

- **Requirement 4.2**: Add hotel to favorites
- **Requirement 4.3**: Remove hotel from favorites
- **Requirement 4.4**: Display favorite status

## Basic Usage

```jsx
import AddToFavoritesButton from '@/components/hotel/AddToFavoritesButton';

function HotelCard({ hotel }) {
  return (
    <div className="hotel-card">
      <h3>{hotel.name}</h3>
      
      {/* Add the button */}
      <AddToFavoritesButton
        hotelId={hotel.id}
        hotelData={hotel}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `hotelId` | `string` | Yes | - | The unique ID of the hotel |
| `hotelData` | `Object` | Yes | - | The hotel data object (see below) |
| `className` | `string` | No | `''` | Additional CSS classes |
| `size` | `number` | No | `20` | Icon size in pixels |
| `onToggle` | `Function` | No | - | Callback when favorite status changes |

### hotelData Object

The `hotelData` object should contain the following properties:

```typescript
{
  id: string;              // Hotel ID
  name: string;            // Hotel name
  address?: string;        // Hotel address
  location?: string;       // Alternative location field
  rating?: number;         // Hotel rating (0-5)
  pricePerNight?: number;  // Price per night
  currency?: string;       // Currency code (default: 'VND')
  images?: string[];       // Array of image URLs
  image?: string;          // Single image URL
  thumbnail?: string;      // Thumbnail image URL
}
```

## Advanced Usage

### With Custom Styling

```jsx
<AddToFavoritesButton
  hotelId={hotel.id}
  hotelData={hotel}
  className="absolute top-3 right-3 bg-white/80 p-2 rounded-full"
  size={24}
/>
```

### With Callback

```jsx
const handleFavoriteToggle = (isFavorited) => {
  console.log(`Hotel is now ${isFavorited ? 'favorited' : 'unfavorited'}`);
  // Refresh favorites list, update UI, etc.
};

<AddToFavoritesButton
  hotelId={hotel.id}
  hotelData={hotel}
  onToggle={handleFavoriteToggle}
/>
```

### In a Hotel Card (Full Example)

```jsx
import AddToFavoritesButton from '@/components/hotel/AddToFavoritesButton';
import Icon from '@/components/ui/Icon';

function HotelCard({ hotel, onClick }) {
  return (
    <article
      onClick={() => onClick?.(hotel)}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-card hover:-translate-y-1 hover:shadow-editorial transition-all duration-200"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={hotel.images?.[0]}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Button - positioned in top-right corner */}
        <div className="absolute top-3 right-3">
          <AddToFavoritesButton
            hotelId={hotel.id}
            hotelData={hotel}
            className="glass p-2 rounded-full hover:bg-white/90 transition-all shadow-sm"
            size={20}
          />
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 left-3 glass px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Icon name="star" filled size={14} className="text-amber-500" />
          <span className="text-sm font-bold text-primary">{hotel.rating}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-headline font-bold text-lg text-primary">{hotel.name}</h3>
        <p className="text-xs text-on-surface-variant">{hotel.address}</p>
      </div>
    </article>
  );
}
```

## Behavior

### Authentication Flow

1. **Not Authenticated**: Clicking the button redirects to `/auth/login`
2. **Authenticated**: Clicking the button toggles the favorite status

### Loading States

- **Initial Load**: Shows a spinning icon while checking if the hotel is already favorited
- **During Toggle**: Shows a spinning icon and disables the button during the API call

### Notifications

Success and error notifications appear in the bottom-right corner:

- **Success (Add)**: "Added to favorites" (green background)
- **Success (Remove)**: "Removed from favorites" (green background)
- **Error**: Error message (red background)

Notifications auto-dismiss after 3 seconds or can be manually closed.

### Event Propagation

The button automatically calls `e.stopPropagation()` to prevent triggering parent click events (e.g., opening hotel details when clicking the favorite button in a card).

## Accessibility

The component is fully accessible:

- **ARIA Labels**: `aria-label` changes based on favorite status
- **ARIA Pressed**: `aria-pressed` indicates the current state
- **Keyboard Support**: Fully keyboard accessible
- **Screen Reader**: Notifications use `role="alert"` and `aria-live="polite"`

## Testing

The component includes comprehensive unit tests covering:

- ✅ Rendering with different favorite states
- ✅ Authentication redirect
- ✅ Adding to favorites
- ✅ Removing from favorites
- ✅ Loading states
- ✅ Error handling
- ✅ Callback invocation
- ✅ Event propagation prevention
- ✅ Auto-dismiss notifications

Run tests with:

```bash
npm test -- AddToFavoritesButton.test.jsx
```

## Dependencies

- `@/contexts/AuthContext` - For user authentication state
- `@/services/profile/favorites.service` - For favorites CRUD operations
- `@/components/ui/Icon` - For displaying icons
- `react-router-dom` - For navigation

## Notes

- The component automatically checks the favorite status on mount
- The component handles all error cases gracefully
- Toast notifications are self-contained (no external toast library needed)
- The component is optimized for performance with proper state management

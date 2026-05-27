import { useEffect } from 'react';
import { useApp } from '@/app/AppContext';
import { mapCollectionPlaceToHotel } from '@/utils/collectionPlaceMapper';

/**
 * PlaceDetailModal - Bridge component that triggers the global hotel popup
 * 
 * This component's sole purpose is to:
 * 1. Convert a collection place to a hotel object
 * 2. Trigger the global popup state via setActiveHotel
 * 3. Close itself immediately
 * 
 * It does NOT render any UI - it just kicks off the global popup system.
 * 
 * @param {Object} props
 * @param {Object|null} props.place - Collection place from GET /collections/{id}/places
 * @param {Function} props.onClose - Close handler to dismiss this bridge component
 */
export default function PlaceDetailModal({ place, onClose }) {
  const { setActiveHotel } = useApp();

  useEffect(() => {
    if (place) {
      // Convert collection place to hotel format
      const hotel = mapCollectionPlaceToHotel(place);
      
      if (hotel) {
        // Trigger the global hotel popup
        setActiveHotel(hotel);
        
        // Close this bridge component immediately
        onClose();
      }
    }
  }, [place, setActiveHotel, onClose]);

  // This component renders nothing - it's just an event trigger
  return null;
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { favoritesService } from '@/services/profile/favorites.service';
import FavoriteHotelCard from './FavoriteHotelCard';
import EmptyState from './EmptyState';
import Icon from '@/components/ui/Icon';
import HotelPopup from '@/components/hotel/components/HotelPopup';

/**
 * FavoritesSection Component
 * Display and manage user's favorite hotels
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * @param {Object} props
 * @param {string} props.userId - User ID (optional, will use AuthContext if not provided)
 * 
 * @example
 * ```jsx
 * import FavoritesSection from '@/components/profile/FavoritesSection';
 * 
 * function ProfilePage() {
 *   return (
 *     <div>
 *       <FavoritesSection />
 *     </div>
 *   );
 * }
 * ```
 */
const FavoritesSection = ({ userId: propUserId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = propUserId || user?.uid;

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  /**
   * Fetch favorites from Firestore
   * Requirements: 5.1, 5.5
   */
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await favoritesService.getFavorites(userId);
        setFavorites(data);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError(err.message || 'Failed to load favorites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  /**
   * Handle remove favorite with optimistic UI update
   * Requirements: 5.4
   */
  const handleRemove = async (favoriteId) => {
    if (!userId) return;

    // Optimistic UI update - remove from local state immediately
    const previousFavorites = [...favorites];
    setFavorites(prev => prev.filter(f => f.id !== favoriteId));

    try {
      await favoritesService.removeFavorite(userId, favoriteId);
    } catch (err) {
      console.error('Error removing favorite:', err);
      // Revert optimistic update on error
      setFavorites(previousFavorites);
      // Note: We don't set the error state here to avoid showing error UI
      // The user will see the item reappear which indicates the removal failed
    }
  };

  /**
   * Handle view hotel details - Show popup with favorite hotel data
   * Requirements: 5.3
   */
  const handleViewDetails = (hotelId) => {
    // Find the hotel from favorites list
    const hotel = favorites.find(f => f.hotelId === hotelId);
    if (hotel) {
      // Transform favorite data to hotel format for popup
      const hotelData = {
        id: hotel.hotelId,
        name: hotel.name,
        address: hotel.location,
        location: hotel.location,
        rating: hotel.rating,
        pricePerNight: hotel.pricePerNight,
        currency: hotel.currency || 'VND',
        images: hotel.images || [hotel.imageUrl],
        // Add default values for popup
        amenities: hotel.amenities || [],
        landmarks: hotel.landmarks || [],
        reviews: hotel.reviews || []
      };
      setSelectedHotel(hotelData);
    }
  };

  /**
   * Handle close popup
   */
  const handleClosePopup = () => {
    setSelectedHotel(null);
  };

  /**
   * Handle retry on error
   */
  const handleRetry = () => {
    setError(null);
    // Trigger re-fetch by updating a dependency
    if (userId) {
      setLoading(true);
      favoritesService.getFavorites(userId)
        .then(data => {
          setFavorites(data);
          setError(null);
        })
        .catch(err => {
          console.error('Error fetching favorites:', err);
          setError(err.message || 'Failed to load favorites. Please try again.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Loading state
  // Requirements: 5.1
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icon name="progress_activity" size={48} className="text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant">Loading favorites...</p>
      </div>
    );
  }

  // Error state
  // Requirements: 5.1
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <Icon name="error" size={40} className="text-red-600" />
        </div>
        <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
          Failed to Load Favorites
        </h3>
        <p className="text-base text-on-surface-variant max-w-md mb-6">
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Icon name="refresh" size={20} />
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  // Requirements: 5.2
  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="favorite_border"
        title="No Favorites Yet"
        description="Start adding hotels to your favorites to see them here. You can favorite hotels from search results or hotel details pages."
        actionLabel="Browse Hotels"
        onAction={() => navigate('/')}
      />
    );
  }

  // Display favorites grid
  // Requirements: 5.3, 5.4, 5.5
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-2xl text-on-surface">
              Favorite Hotels
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              {favorites.length} {favorites.length === 1 ? 'hotel' : 'hotels'} saved
            </p>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(hotel => (
            <FavoriteHotelCard
              key={hotel.id}
              hotel={hotel}
              onRemove={handleRemove}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>

      {/* Hotel Popup */}
      {selectedHotel && (
        <HotelPopup
          hotel={selectedHotel}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
};

export default FavoritesSection;

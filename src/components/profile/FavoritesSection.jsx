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
 * Requirements: 15.5, 15.6, 15.7, 15.8
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
const FavoritesSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);

  /**
   * Fetch favorites from backend API
   * Requirements: 15.5, 15.6, 15.8
   */
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) {
        setError('Bạn phải đăng nhập để lưu các địa điểm yêu thích');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await favoritesService.getFavorites();
        setFavorites(data);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError(err.message || 'Failed to load favorites. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated]);

  /**
   * Handle remove favorite with optimistic UI update
   * Requirements: 15.3, 15.4
   */
  const handleRemove = async (favoriteId) => {
    if (!isAuthenticated) return;

    // Optimistic UI update - remove from local state immediately
    const previousFavorites = [...favorites];
    setFavorites(prev => prev.filter(f => f.id !== favoriteId && f.hotelId !== favoriteId));

    try {
      await favoritesService.removeFavorite(favoriteId);
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
   * Requirements: 15.8
   */
  const handleViewDetails = (hotelId) => {
    // Find the hotel from favorites list
    const hotel = favorites.find(f => f.hotelId === hotelId || f.id === hotelId);
    if (hotel) {
      // Transform favorite data to hotel format for popup
      const hotelData = {
        id: hotel.hotelId || hotel.id,
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
        reviews: hotel.reviews || [],
        coordinates: hotel.coordinates || null
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
    // Trigger re-fetch
    if (isAuthenticated) {
      setLoading(true);
      favoritesService.getFavorites()
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
  // Requirements: 15.6
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icon name="progress_activity" size={48} className="text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant">Loading favorites...</p>
      </div>
    );
  }

  // Error state
  // Requirements: 15.7
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <Icon name="error" size={40} className="text-red-600" />
        </div>
        <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
          {error === 'Bạn phải đăng nhập để lưu các địa điểm yêu thích' 
            ? 'Authentication Required' 
            : 'Failed to Load Favorites'}
        </h3>
        <p className="text-base text-on-surface-variant max-w-md mb-6">
          {error}
        </p>
        {error === 'Bạn phải đăng nhập để lưu các địa điểm yêu thích' ? (
          <button
            onClick={() => navigate('/auth/login')}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Icon name="login" size={20} />
            Login
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Icon name="refresh" size={20} />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Empty state
  // Requirements: 15.8
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
  // Requirements: 15.8
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
              key={hotel.id || hotel.hotelId}
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

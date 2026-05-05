import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addFavorite, removeFavorite, getFavoriteByHotelId } from '@/services/profile/favorites.service';
import Icon from '@/components/ui/Icon';

/**
 * AddToFavoritesButton Component
 * Requirements: 4.2, 4.3, 4.4
 * 
 * A button component that allows users to add/remove hotels from their favorites.
 * Displays a heart icon (filled if favorited, outlined if not) and handles the
 * toggle functionality with loading states and toast notifications.
 * 
 * @param {Object} props
 * @param {string} props.hotelId - The ID of the hotel
 * @param {Object} props.hotelData - The hotel data object containing name, location, rating, etc.
 * @param {string} [props.className] - Additional CSS classes
 * @param {number} [props.size] - Icon size (default: 20)
 * @param {Function} [props.onToggle] - Optional callback when favorite status changes
 */
const AddToFavoritesButton = ({ 
  hotelId, 
  hotelData, 
  className = '', 
  size = 20,
  onToggle 
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if hotel is already favorited on mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isAuthenticated || !user?.uid || !hotelId) {
        setCheckingStatus(false);
        return;
      }

      try {
        const favorite = await getFavoriteByHotelId(user.uid, hotelId);
        if (favorite) {
          setIsFavorite(true);
          setFavoriteId(favorite.id);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkFavoriteStatus();
  }, [isAuthenticated, user?.uid, hotelId]);

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  /**
   * Handle favorite toggle
   */
  const handleToggleFavorite = async (e) => {
    e.stopPropagation(); // Prevent parent click events (e.g., card click)

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    if (!hotelId || !hotelData) {
      console.error('Missing hotelId or hotelData');
      return;
    }

    setLoading(true);

    try {
      if (isFavorite && favoriteId) {
        // Remove from favorites
        await removeFavorite(user.uid, favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
        
        setNotification({
          type: 'success',
          message: 'Removed from favorites'
        });
      } else {
        // Add to favorites
        const newFavorite = await addFavorite(user.uid, {
          id: hotelId,
          name: hotelData.name,
          address: hotelData.address || hotelData.location,
          location: hotelData.address || hotelData.location,
          rating: hotelData.rating,
          pricePerNight: hotelData.pricePerNight,
          currency: hotelData.currency || 'VND',
          images: hotelData.images,
          image: hotelData.images?.[0],
          thumbnail: hotelData.images?.[0]
        });
        
        setIsFavorite(true);
        setFavoriteId(newFavorite.id);
        
        setNotification({
          type: 'success',
          message: 'Added to favorites'
        });
      }

      // Call optional callback
      if (onToggle) {
        onToggle(!isFavorite);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      setNotification({
        type: 'error',
        message: error.message || 'Failed to update favorites. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggleFavorite}
        disabled={loading || checkingStatus}
        className={`relative group/fav transition-all ${className}`}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {loading || checkingStatus ? (
          // Loading state - spinning icon
          <Icon 
            name="progress_activity" 
            size={size} 
            className="text-primary animate-spin"
            aria-hidden="true"
          />
        ) : (
          // Heart icon - filled if favorited, outlined if not
          <Icon 
            name={isFavorite ? 'favorite' : 'favorite_border'}
            size={size}
            className={`transition-all ${
              isFavorite 
                ? 'text-red-500 group-hover/fav:scale-110' 
                : 'text-primary group-hover/fav:text-red-500 group-hover/fav:scale-110'
            }`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Toast Notification - Rendered via Portal to escape card container */}
      {notification && createPortal(
        <>
          {/* Background Overlay */}
          <div 
            className="fixed inset-0 bg-black/30 z-[9998] animate-fade-in"
            onClick={() => setNotification(null)}
          />
          
          {/* Notification Card - Centered */}
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] animate-scale-in"
            role="alert"
            aria-live="polite"
          >
            <div
              className="flex flex-col items-center gap-3 rounded-2xl px-8 py-6 shadow-2xl min-w-[320px]"
              style={{
                backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
                color: 'white'
              }}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Icon
                  name={notification.type === 'success' ? 'favorite' : 'error_outline'}
                  size={32}
                  className="text-white"
                  aria-hidden="true"
                />
              </div>
              
              {/* Message */}
              <p className="text-lg font-semibold text-center">
                {notification.message}
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => setNotification(null)}
                className="mt-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                aria-label="Close notification"
              >
                Close
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default AddToFavoritesButton;

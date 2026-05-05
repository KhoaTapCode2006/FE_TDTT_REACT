import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { fmtPrice } from '@/utils/format';

/**
 * FavoriteHotelCard Component
 * Display individual favorite hotel with remove and view details functionality
 * Requirements: 5.3, 5.4
 * 
 * @param {Object} props
 * @param {Object} props.hotel - Favorite hotel object
 * @param {string} props.hotel.id - Favorite document ID
 * @param {string} props.hotel.hotelId - Hotel ID
 * @param {string} props.hotel.name - Hotel name
 * @param {string} props.hotel.location - Hotel location
 * @param {number} props.hotel.rating - Hotel rating (0-5)
 * @param {number} props.hotel.pricePerNight - Price per night
 * @param {string} props.hotel.currency - Currency code
 * @param {string} props.hotel.imageUrl - Hotel thumbnail image URL
 * @param {Date} props.hotel.addedAt - Date added to favorites
 * @param {Function} props.onRemove - Remove from favorites callback (receives favoriteId)
 * @param {Function} props.onViewDetails - View hotel details callback (receives hotelId)
 * 
 * @example
 * ```jsx
 * import FavoriteHotelCard from '@/components/profile/FavoriteHotelCard';
 * import { favoritesService } from '@/services/profile/favorites.service';
 * 
 * function FavoritesSection({ userId }) {
 *   const [favorites, setFavorites] = useState([]);
 * 
 *   const handleRemove = async (favoriteId) => {
 *     await favoritesService.removeFavorite(userId, favoriteId);
 *     setFavorites(prev => prev.filter(f => f.id !== favoriteId));
 *   };
 * 
 *   const handleViewDetails = (hotelId) => {
 *     navigate(`/hotels/${hotelId}`);
 *   };
 * 
 *   return (
 *     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 *       {favorites.map(hotel => (
 *         <FavoriteHotelCard
 *           key={hotel.id}
 *           hotel={hotel}
 *           onRemove={handleRemove}
 *           onViewDetails={handleViewDetails}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
const FavoriteHotelCard = ({ hotel, onRemove, onViewDetails }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    setShowConfirmation(true);
  };

  const handleConfirmRemove = async (e) => {
    e.stopPropagation();
    setIsRemoving(true);
    try {
      await onRemove(hotel.id);
    } catch (error) {
      console.error('Error removing favorite:', error);
      setIsRemoving(false);
      setShowConfirmation(false);
    }
  };

  const handleCancelRemove = (e) => {
    e.stopPropagation();
    setShowConfirmation(false);
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    onViewDetails(hotel.hotelId);
  };

  const imageUrl = hotel.imageUrl || '/placeholder.png';

  return (
    <div className="bg-white rounded-xl border border-outline-variant/20 overflow-hidden hover:shadow-lg transition-all group">
      {/* Hotel Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '/placeholder.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Rating Badge */}
        {hotel.rating > 0 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1">
            <Icon name="star" size={14} className="text-yellow-500" variant="filled" />
            <span className="text-sm font-semibold text-on-surface">
              {hotel.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Favorite Badge */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center">
          <Icon name="favorite" size={18} className="text-white" variant="filled" />
        </div>
      </div>

      {/* Hotel Info */}
      <div className="p-4">
        {/* Hotel Name */}
        <h3 className="font-semibold text-base text-on-surface mb-2 line-clamp-1">
          {hotel.name}
        </h3>
        
        {/* Location */}
        <div className="flex items-center gap-1 text-on-surface-variant mb-3">
          <Icon name="location_on" size={16} />
          <span className="text-sm line-clamp-1">{hotel.location}</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-xl text-primary">
              {fmtPrice(hotel.pricePerNight, hotel.currency)}
            </span>
            <span className="text-sm text-on-surface-variant">/night</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!showConfirmation ? (
          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Icon name="visibility" size={18} />
              View Details
            </button>
            
            <button
              onClick={handleRemoveClick}
              className="flex items-center justify-center gap-2 bg-surface-container-low text-on-surface px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Remove from favorites"
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ) : (
          // Confirmation State
          <div className="space-y-2">
            <p className="text-sm text-on-surface-variant text-center">
              Remove from favorites?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelRemove}
                disabled={isRemoving}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isRemoving ? (
                  <>
                    <Icon name="progress_activity" size={18} className="animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={18} />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Added Date */}
        {hotel.addedAt && (
          <div className="flex items-center gap-1 text-on-surface-variant mt-3 pt-3 border-t border-outline-variant/20">
            <Icon name="schedule" size={14} />
            <span className="text-xs">
              Added {new Date(hotel.addedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteHotelCard;

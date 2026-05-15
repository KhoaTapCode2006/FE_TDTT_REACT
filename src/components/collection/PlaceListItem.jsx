import { useState, useCallback, memo } from 'react';
import Icon from '@/components/ui/Icon';
import HotelCard from '@/components/hotel/components/HotelCard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fmtDate } from '@/utils/format';

/**
 * PlaceListItem Component
 * Displays individual places in compact and expanded views
 * 
 * @param {Object} props
 * @param {Object} props.place - Place data object containing place_id, name, images, added_by, added_at, and hotel data
 * @param {boolean} props.isExpanded - Whether the place is currently expanded
 * @param {Function} props.onToggle - Callback when place is clicked to toggle expand/collapse
 * @param {boolean} props.isEditMode - Whether the list is in edit mode
 * @param {Function} props.onRemove - Callback when remove button is clicked (only in edit mode)
 */
function PlaceListItem({ 
  place, 
  isExpanded = false, 
  onToggle, 
  isEditMode = false, 
  onRemove 
}) {
  const [imageError, setImageError] = useState(false);
  const [cardError, setCardError] = useState(false);

  // Fallback values for missing data
  const placeName = place?.name || 'Unknown Place';
  const addedByName = place?.added_by?.display_name || place?.added_by?.username || 'Unknown User';
  const addedAtDate = place?.added_at ? fmtDate(place.added_at) : '-';
  
  // Get thumbnail image or use placeholder
  const placeholderImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
  const thumbnailUrl = !imageError && place?.images?.[0]?.thumbnail 
    ? place.images[0].thumbnail 
    : !imageError && place?.images?.[0] 
    ? place.images[0] 
    : placeholderImage;

  // Task 8.2: Use useCallback for handlers to prevent unnecessary re-renders
  const handleRemoveClick = useCallback((e) => {
    e.stopPropagation();
    if (onRemove && place?.place_id) {
      onRemove(place.place_id);
    }
  }, [onRemove, place?.place_id]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleCardError = useCallback(() => {
    setCardError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setCardError(false);
  }, []);

  const handleToggle = useCallback(() => {
    onToggle?.();
  }, [onToggle]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onToggle?.();
    }
  }, [onToggle]);

  return (
    <div className="border border-outline-variant/40 rounded-2xl overflow-hidden bg-surface-container-low shadow-sm hover:shadow-md transition-all">
      {/* Compact View */}
      <div 
        onClick={handleToggle}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer hover:bg-surface-container/50 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${placeName}`}
        aria-expanded={isExpanded}
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-container">
          <img
            src={thumbnailUrl}
            alt={placeName}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </div>

        {/* Place Info */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <h3 className="font-semibold text-base text-on-surface truncate mb-1">
            {placeName}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1">
              <Icon name="person" size={14} />
              <span className="truncate">Thêm bởi: {addedByName}</span>
            </div>
            <span className="hidden sm:inline text-outline-variant">•</span>
            <div className="flex items-center gap-1">
              <Icon name="schedule" size={14} />
              <span>{addedAtDate}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          {/* Remove Button (Edit Mode Only) */}
          {isEditMode && (
            <button
              onClick={handleRemoveClick}
              className="p-2 rounded-full hover:bg-red-50 transition-colors group min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Xóa khỏi collection"
              aria-label={`Remove ${placeName}`}
            >
              <Icon 
                name="delete" 
                size={20} 
                className="text-on-surface-variant group-hover:text-red-600 transition-colors" 
              />
            </button>
          )}

          {/* Expand/Collapse Icon */}
          <div className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Icon 
              name={isExpanded ? 'expand_less' : 'expand_more'} 
              size={24} 
              className="text-on-surface-variant transition-transform"
            />
          </div>
        </div>
      </div>

      {/* Task 8.5: Only render HotelCard when place is expanded */}
      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-outline-variant/40 p-3 sm:p-4 bg-surface transition-all duration-300 ease-in-out">
          {/* Task 7.4: Wrap HotelCard in ErrorBoundary */}
          {cardError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 sm:px-4 py-6 text-center">
              <Icon name="error_outline" size={32} className="text-red-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-700 mb-3">Không thể tải thông tin khách sạn</p>
              {/* Task 7.6: Retry button for API errors */}
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 min-h-[44px]"
              >
                <Icon name="refresh" size={16} /> Thử lại
              </button>
            </div>
          ) : (
            <ErrorBoundary>
              <HotelCard 
                hotel={place} 
                onClick={() => {
                  // Optional: Navigate to hotel detail page
                  console.log('Hotel clicked:', place);
                }}
                onError={handleCardError}
              />
            </ErrorBoundary>
          )}
        </div>
      )}
    </div>
  );
}

// Task 8.1: Wrap PlaceListItem with React.memo to prevent unnecessary re-renders
export default memo(PlaceListItem);

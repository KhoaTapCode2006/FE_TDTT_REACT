import { useState, useCallback, memo } from 'react';
import Icon from '@/components/ui/Icon';
import { fmtDate } from '@/utils/format';
import { isValidAvatarUrl } from '@/utils/collectionPlaceMapper';

/**
 * @param {Object} props
 * @param {Object} props.place - Place data from collection places API
 * @param {Function} props.onViewDetails - Opens place detail popup
 * @param {boolean} props.isEditMode
 * @param {Function} [props.onRemove]
 */
function PlaceListItem({
  place,
  onViewDetails,
  isEditMode = false,
  onRemove,
}) {
  const [imageError, setImageError] = useState(false);

  const placeName = place?.name || 'Unknown Place';
  const addedByName = place?.added_by?.display_name || place?.added_by?.username || 'Unknown User';
  const addedByAvatarUrl = isValidAvatarUrl(place?.added_by?.avatar_url)
    ? place.added_by.avatar_url
    : null;
  const addedByInitial = (
    place?.added_by?.username ||
    place?.added_by?.display_name ||
    'U'
  ).charAt(0).toUpperCase();
  const addedAtDate = place?.added_at ? fmtDate(place.added_at) : '-';

  const placeholderImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';
  const thumbnailUrl = !imageError && place?.images?.[0]?.thumbnail
    ? place.images[0].thumbnail
    : !imageError && place?.images?.[0]
      ? place.images[0]
      : placeholderImage;

  const handleRemoveClick = useCallback((e) => {
    e.stopPropagation();
    if (onRemove && place?.place_id) {
      onRemove(place.place_id);
    }
  }, [onRemove, place?.place_id]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(place);
  }, [onViewDetails, place]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onViewDetails?.(place);
    }
  }, [onViewDetails, place]);

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-sm transition-all hover:shadow-md">
      <div
        onClick={handleViewDetails}
        className="flex cursor-pointer flex-col items-start gap-3 p-3 transition-colors hover:bg-surface-container/50 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`Xem chi tiết ${placeName}`}
      >
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-surface-container sm:h-20 sm:w-20">
          <img
            src={thumbnailUrl}
            alt={placeName}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
        </div>

        <div className="min-w-0 w-full flex-1 sm:w-auto">
          <h3 className="mb-1 truncate text-base font-semibold text-on-surface">
            {placeName}
          </h3>
          <div className="flex flex-col gap-1 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:gap-2">
            <div className="flex items-center gap-1.5">
              {addedByAvatarUrl ? (
                <img
                  src={addedByAvatarUrl}
                  alt={`${addedByName} avatar`}
                  className="h-5 w-5 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-on-primary">
                  {addedByInitial}
                </div>
              )}
              <span className="truncate">Thêm bởi: {addedByName}</span>
            </div>
            <span className="hidden text-outline-variant sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Icon name="schedule" size={14} />
              <span>{addedAtDate}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 self-end sm:self-center">
          {isEditMode && (
            <button
              type="button"
              onClick={handleRemoveClick}
              className="group flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 transition-colors hover:bg-red-50"
              title="Xóa khỏi collection"
              aria-label={`Remove ${placeName}`}
            >
              <Icon
                name="delete"
                size={20}
                className="text-on-surface-variant transition-colors group-hover:text-red-600"
              />
            </button>
          )}

          <div className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2">
            <Icon name="chevron_right" size={24} className="text-on-surface-variant" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PlaceListItem);

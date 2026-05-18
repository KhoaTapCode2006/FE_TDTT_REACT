import { useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import HotelPopup from '@/components/hotel/components/HotelPopup';
import { fmtDate } from '@/utils/format';
import { isValidAvatarUrl, mapCollectionPlaceToHotel } from '@/utils/collectionPlaceMapper';

/**
 * @param {Object} props
 * @param {Object|null} props.place - Collection place from GET /collections/{id}/places
 * @param {Function} props.onClose
 */
export default function PlaceDetailModal({ place, onClose }) {
  const hotel = mapCollectionPlaceToHotel(place);

  useEffect(() => {
    if (!place) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [place, onClose]);

  if (!place || !hotel) return null;

  const addedBy = place.added_by;
  const addedByName =
    addedBy?.display_name || addedBy?.username || 'Người dùng';
  const addedByInitial = (addedBy?.username || addedBy?.display_name || 'U')
    .charAt(0)
    .toUpperCase();
  const avatarUrl = isValidAvatarUrl(addedBy?.avatar_url)
    ? addedBy.avatar_url
    : null;
  const aiScore = place.ai_sentiment?.ai_score;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative flex h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-shrink-0 flex-col gap-3 border-b border-outline-variant/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${addedByName} avatar`}
                className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-on-primary">
                {addedByInitial}
              </div>
            )}
            <div className="min-w-0">
              <p id="place-detail-title" className="truncate text-sm font-semibold text-on-surface">
                {hotel.name}
              </p>
              <p className="text-xs text-on-surface-variant">
                Thêm bởi {addedByName}
                {place.added_at ? ` · ${fmtDate(new Date(place.added_at))}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {aiScore != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Icon name="auto_awesome" size={14} />
                AI {Number(aiScore).toFixed(1)}
              </span>
            )}
            {place.link && (
              <a
                href={place.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 px-3 py-1 text-xs font-semibold text-on-surface transition hover:bg-surface-container"
              >
                <Icon name="open_in_new" size={14} />
                Trang web
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 transition hover:bg-surface-container"
              aria-label="Đóng"
            >
              <Icon name="close" size={22} />
            </button>
          </div>
        </div>

        {place.ai_summary?.overview && (
          <div className="flex-shrink-0 border-b border-outline-variant/20 bg-surface-container-low px-4 py-2.5 sm:px-5">
            <p className="text-xs leading-5 text-on-surface-variant">
              {place.ai_summary.overview}
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden">
          <HotelPopup hotel={hotel} onClose={onClose} embedded />
        </div>
      </div>
    </div>
  );
}

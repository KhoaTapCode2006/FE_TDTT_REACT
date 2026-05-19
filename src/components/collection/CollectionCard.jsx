import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import LikeButton from '@/components/collection/LikeButton';

/**
 * CollectionCard Component
 * Displays a collection card with thumbnail, name, description, tags, and actions
 * 
 * @param {Object} props
 * @param {Object} props.collection - Collection data object containing id, name, description, thumbnail_url, tags, places, visibility, saved_count, owner_uid, contributors, and views
 * @param {boolean} props.isOwner - Whether current user owns this collection. If true, shows edit/delete actions instead of save button
 * @param {Function} props.onDelete - Callback when delete button is clicked. Signature: (collectionId: string) => Promise<void>
 * @param {Function} props.onSave - Callback when save/unsave button is clicked. Signature: (collectionId: string, shouldSave: boolean) => Promise<void>. The shouldSave parameter indicates the desired state (true to save, false to unsave)
 * @param {boolean} props.isSaved - Whether collection is currently saved by the current user. Used to display the correct icon state (filled heart if saved, outline heart if not saved)
 * @param {boolean} props.showActions - Whether to show action buttons (edit/delete for owners, save for non-owners)
 * @param {string} props.returnTab - Main dashboard tab when going back: 'my' or 'global'
 * @param {string} [props.returnMyTab] - When returnTab is 'my', sub-tab: 'owned' | 'contributing' | 'saved'
 * @param {string} props.currentUserId - Current user's UID for displaying "You" in contributors list
 * @param {boolean} props.showWeeklyViews - Whether to show weekly views instead of total views (for weekly trends tab)
 */
function CollectionCard({ 
  collection, 
  isOwner = false, 
  onDelete, 
  onSave,
  isSaved = false,
  showActions = true,
  returnTab = 'my',
  returnMyTab = null,
  currentUserId = null,
  showWeeklyViews = false
}) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const returnState = returnMyTab
    ? { returnTab, returnMyTab }
    : { returnTab };

  const handleEdit = () => {
    navigate(`/collections/${collection.id}`, { state: { autoEdit: true, ...returnState } });
  };

  const handleView = () => {
    navigate(`/collections/${collection.id}`, { state: { ...returnState } });
  };

  const handleDelete = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa collection "${collection.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete?.(collection.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(collection.id, !isSaved);
    } catch (error) {
      // Task 8.2: Enhanced error logging for debugging
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Build display list: owner + other contributors, with "You" first
  const getContributorsList = () => {
    const contributors = [];
    const ownerUid = collection.owner?.uid ?? collection.owner_uid;

    if (ownerUid) {
      let label;
      if (ownerUid && ownerUid === currentUserId) {
        label = 'Bạn';
      } else if (collection.owner?.display_name) {
        label = collection.owner.display_name;
      } else if (collection.owner?.username) {
        label = collection.owner.username;
      } else {
        label = `${ownerUid.substring(0, 8)}...`;
      }
      contributors.push({ uid: ownerUid, label, isOwner: true });
    }

    if (collection.contributors && collection.contributors.length > 0) {
      collection.contributors.forEach((c) => {
        if (ownerUid && c.uid === ownerUid) {
          return;
        }
        if (c.uid === currentUserId && contributors.some((x) => x.uid === currentUserId)) {
          return;
        }

        contributors.push({
          uid: c.uid,
          label:
            c.uid === currentUserId
              ? 'Bạn'
              : c.display_name || c.username || `${c.uid.substring(0, 8)}...`,
          isOwner: false,
        });
      });
    }
    
    // Sort: "Bạn" first, then others
    contributors.sort((a, b) => {
      if (a.label === 'Bạn') return -1;
      if (b.label === 'Bạn') return 1;
      return 0;
    });
    
    return contributors;
  };

  const contributors = getContributorsList();

  const placeholderImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';

  return (
    <div className="group relative flex flex-col h-full overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-low shadow-sm transition-all hover:shadow-xl hover:border-primary/30">
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-surface-container flex-shrink-0">
        <img
          src={collection.thumbnail_url || placeholderImage}
          alt={collection.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = placeholderImage;
          }}
        />

        {/* Save Button (for non-owners) */}
        {/* Task 8.1: Added hover animation, scale transition, and loading spinner */}
        {!isOwner && showActions && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="save-button-focus save-button-hover touch-target-min absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:bg-white hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            title={isSaved ? 'Bỏ lưu collection' : 'Lưu collection'}
            aria-label={isSaved ? 'Bỏ lưu collection' : 'Lưu collection'}
            aria-pressed={isSaved}
            aria-busy={isSaving}
          >
            {isSaving ? (
              <div className="animate-spin">
                <Icon name="refresh" size={20} className="text-on-surface-variant" />
              </div>
            ) : (
              <Icon 
                name={isSaved ? 'favorite' : 'favorite_border'} 
                size={20} 
                className={`transition-all duration-300 ${isSaved ? 'text-red-500 scale-110' : 'text-on-surface-variant'}`}
              />
            )}
            {isSaving && <span className="sr-only">Đang lưu collection...</span>}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
            {collection.name}
          </h3>
          <p className="text-sm text-on-surface-variant line-clamp-2 mt-1 min-h-[2.5rem]">
            {collection.description || 'Không có mô tả'}
          </p>
        </div>

        {/* Tags */}
        <div className="mb-3 min-h-[2.5rem]">
          {collection.tags && collection.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {collection.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  #{tag}
                </span>
              ))}
              {collection.tags.length > 3 && (
                <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                  +{collection.tags.length - 3}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-on-surface-variant/50 italic">Không có tag</div>
          )}
        </div>

        {/* Stats */}
        {/* Đã lột bỏ khung nền, viền và tinh chỉnh margin để ép sát lề trái */}
        <div className="flex flex-row items-center divide-x divide-gray-300 text-xs mb-3 w-fit max-w-full -ml-0.5">
          
          {/* 1. Địa điểm */}
          <div className="flex items-center gap-1 pr-2 whitespace-nowrap">
            <Icon name="place" size={14} className="text-blue-500 shrink-0" />
            <span className="font-semibold text-gray-800">
              {collection.place_count ?? collection.places?.length ?? 0}
            </span>
            <span className="text-gray-500">địa điểm</span>
          </div>

          {/* 2. Lượt xem */}
          <div className="flex items-center gap-1 px-2 whitespace-nowrap">
            <Icon name="visibility" size={14} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-gray-800">
              {showWeeklyViews ? (collection.views?.weekly_views || 0) : (collection.views?.total_views || 0)}
            </span>
            <span className="text-gray-500">lượt xem</span>
          </div>

          {/* 3. Lượt lưu */}
          <div className="flex items-center gap-1 pl-2 whitespace-nowrap">
            <Icon name="favorite" size={14} className="text-red-400 shrink-0" />
            <span className="font-semibold text-gray-800">
              {collection.saved_count || 0}
            </span>
            <span className="text-gray-500">lượt lưu</span>
          </div>

        </div>

        {/* Owner/Contributors Info */}
        <div className="flex items-center gap-2 pb-3 border-t border-outline-variant/30 pt-3">
          {/* Owner Avatar */}
          {collection.owner?.avatar_url ? (
            <img
              src={collection.owner.avatar_url}
              alt={collection.owner.display_name || collection.owner.username || 'Owner'}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"
            style={{ display: collection.owner?.avatar_url ? 'none' : 'flex' }}
          >
            <Icon name="person" size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {contributors.length > 0 ? (
              <div className="text-xs text-on-surface-variant">
                {contributors.slice(0, 2).map((contributor, index) => (
                  <span key={contributor.uid}>
                    {contributor.label}
                    {index < Math.min(contributors.length, 2) - 1 && ', '}
                  </span>
                ))}
                {contributors.length > 2 && (
                  <span className="text-on-surface-variant/70"> +{contributors.length - 2}</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-on-surface-variant">Không có người đóng góp</span>
            )}
          </div>
        </div>

        {/* Spacer to push actions to bottom */}
        <div className="flex-grow"></div>

        {/* Actions */}
        {showActions && (
          <div className="mt-auto w-full">
            {isOwner ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleView}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-outline-variant/70 bg-surface-container px-3 py-2.5 text-xs font-semibold text-on-surface transition-all hover:bg-surface-container-high hover:border-primary/50"
                >
                  <Icon name="visibility" size={16} />
                  <span className="hidden sm:inline">Xem</span>
                </button>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-3 py-2.5 text-xs font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-lg"
                >
                  <Icon name="edit" size={16} />
                  <span className="hidden sm:inline">Sửa</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-1 rounded-full border border-red-400/80 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="delete" size={16} />
                  <span className="hidden sm:inline">{isDeleting ? '...' : 'Xóa'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleView}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container px-4 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-high hover:border-primary/50"
              >
                <Icon name="visibility" size={16} />
                Xem chi tiết
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionCard;

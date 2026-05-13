import { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * ListCard Component
 * Display saved list collection
 * 
 * @param {Object} props
 * @param {Object} props.list - List object
 * @param {string} props.variant - Card variant ('featured' | 'standard')
 * @param {Function} props.onViewList - View list callback
 * @param {Function} props.onDeleteList - Delete list callback
 */
const ListCard = ({ list, variant = 'standard', onViewList, onDeleteList }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
      onDeleteList(list.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // TODO: Implement edit functionality
    console.log('Edit list:', list.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    // TODO: Implement share functionality
    console.log('Share list:', list.id);
  };

  const coverImage = list.image || list.hotels?.[0]?.image || '/placeholder.png';

  if (variant === 'featured') {
    return (
      <div
        className="relative bg-white rounded-2xl border border-outline-variant/20 overflow-hidden hover:shadow-xl transition-all cursor-pointer group col-span-full md:col-span-2"
        onClick={() => onViewList(list)}
      >
        {/* Cover Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={coverImage}
            alt={list.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Featured Badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary rounded-lg text-white text-sm font-semibold flex items-center gap-1.5">
            <Icon name="star" size={16} variant="filled" />
            Featured
          </div>

          {/* Action Menu */}
          <div className="absolute top-4 right-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <Icon name="more_vert" size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-outline-variant/20 py-2 z-10">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="edit" size={18} />
                  Edit List
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <Icon name="share" size={18} />
                  Share List
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Icon name="delete" size={18} />
                  Delete List
                </button>
              </div>
            )}
          </div>

          {/* List Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-headline font-bold text-2xl text-white mb-2">
              {list.name}
            </h3>
            {list.description && (
              <p className="text-white/90 text-sm mb-3 line-clamp-2">
                {list.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-white/90">
              <Icon name="hotel" size={18} />
              <span className="text-sm font-semibold">
                {list.count} {list.count === 1 ? 'hotel' : 'hotels'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div
      className="relative bg-white rounded-xl border border-outline-variant/20 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onViewList(list)}
    >
      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={coverImage}
          alt={list.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Hotel Count Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-on-surface text-xs font-semibold flex items-center gap-1">
          <Icon name="hotel" size={14} />
          {list.count}
        </div>

        {/* Action Menu */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <Icon name="more_vert" size={18} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-outline-variant/20 py-2 z-10">
              <button
                onClick={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Icon name="edit" size={18} />
                Edit List
              </button>
              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <Icon name="share" size={18} />
                Share List
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Icon name="delete" size={18} />
                Delete List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List Info */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-on-surface mb-1 truncate">
          {list.name}
        </h3>
        {list.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 mb-2">
            {list.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Icon name="schedule" size={14} />
          <span className="text-xs">
            Updated {new Date(list.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ListCard;

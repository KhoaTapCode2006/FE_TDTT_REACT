import React, { useState, useEffect, memo } from 'react';
import Icon from '@/components/ui/Icon';
import StarRatingFilter from './StarRatingFilter';
import PropertyTypeFilter from './PropertyTypeFilter';
import AmenitiesFilter from './AmenitiesFilter';
import PriceRangeFilter from './PriceRangeFilter';
import AvailableRoomsFilter from './AvailableRoomsFilter';

const FilterModal = memo(({ isOpen, filters, onClose, onApply }) => {
  const [draft, setDraft] = useState({ ...filters });
  const [isApplying, setIsApplying] = useState(false);

  // Update draft when filters prop changes
  useEffect(() => {
    setDraft({ ...filters });
  }, [filters]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCancel = () => {
    setDraft({ ...filters }); // Reset draft to original filters
    onClose();
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(draft);
      onClose();
    } catch (error) {
      console.error('Error applying filters:', error);
      // Error is handled by parent component
    } finally {
      setIsApplying(false);
    }
  };

  const hasAnyFilters = draft.starRating !== null ||
                    draft.types.length > 0 ||
                    draft.amenities.length > 0 ||
                    draft.priceMin !== null ||
                    draft.priceMax !== null ||
                    draft.availableOnly;

  const handleClearAll = () => {
    const clearedFilters = {
      starRating: null,
      types: [],
      amenities: [],
      priceMin: null,
      priceMax: null,
      availableOnly: false,
    };
    setDraft(clearedFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="modal-anim relative bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-7 pt-6 sm:pt-7 pb-4">
          <div>
            <h2 className="font-headline text-xl font-extrabold text-primary">Bộ lọc tìm kiếm</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Tùy chỉnh trải nghiệm lưu trú của bạn</p>
          </div>
          <button 
            onClick={handleCancel} 
            className="p-1.5 rounded-full hover:bg-surface-container-low transition-colors"
            aria-label="Đóng bộ lọc"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-4 sm:px-7 pb-4 flex flex-col gap-6 sm:gap-7 flex-1">
          {!hasAnyFilters && (
            <div className="text-center py-8 text-on-surface-variant">
              <Icon name="filter_alt_off" size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">Chưa có bộ lọc nào được áp dụng</p>
              <p className="text-xs mt-1">Chọn các tùy chọn bên dưới để lọc kết quả</p>
            </div>
          )}
          
          {/* Star Rating Filter */}
          <StarRatingFilter 
            value={draft.starRating}
            onChange={(value) => setDraft(prev => ({ ...prev, starRating: value }))}
          />

          {/* Property Type Filter */}
          <PropertyTypeFilter 
            value={draft.types}
            onChange={(value) => setDraft(prev => ({ ...prev, types: value }))}
          />

          {/* Amenities Filter */}
          <AmenitiesFilter 
            value={draft.amenities}
            onChange={(value) => setDraft(prev => ({ ...prev, amenities: value }))}
          />

          {/* Price Range Filter */}
          <PriceRangeFilter 
            priceMin={draft.priceMin}
            priceMax={draft.priceMax}
            onChange={({ priceMin, priceMax }) => setDraft(prev => ({ ...prev, priceMin, priceMax }))}
          />

          {/* Available Rooms Filter */}
          <AvailableRoomsFilter 
            value={draft.availableOnly}
            onChange={(value) => setDraft(prev => ({ ...prev, availableOnly: value }))}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-7 py-4 sm:py-5 border-t border-outline-variant/10">
          <button 
            onClick={handleClearAll} 
            className="w-full sm:flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-error/30 text-error hover:bg-error/5 transition-colors"
          >
            Xóa tất cả
          </button>
          <button 
            onClick={handleCancel} 
            className="w-full sm:flex-1 py-3.5 rounded-2xl font-bold text-sm border-2 border-outline-variant/30 hover:bg-surface-container-low transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleApply} 
            disabled={isApplying}
            className="w-full sm:flex-[2] py-3.5 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang áp dụng...
              </>
            ) : (
              'Áp dụng'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default FilterModal;
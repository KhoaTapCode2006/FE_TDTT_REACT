import React, { memo } from 'react';
import Icon from '@/components/ui/Icon';

const StarRatingFilter = memo(({ value, onChange }) => {
  // Support both array (multiple selections) and single value for backward compatibility
  const selectedRatings = Array.isArray(value) ? value : (value ? [value] : []);
  
  const handleStarClick = (rating) => {
    // Toggle behavior for multiple selections
    if (selectedRatings.includes(rating)) {
      // Remove rating from selection
      const newRatings = selectedRatings.filter(r => r !== rating);
      onChange(newRatings.length > 0 ? newRatings : null);
    } else {
      // Add rating to selection
      onChange([...selectedRatings, rating]);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Xếp hạng đánh giá {selectedRatings.length > 0 && `(${selectedRatings.length} selected)`}
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isSelected = selectedRatings.includes(rating);
          return (
            <button
              key={rating}
              onClick={() => handleStarClick(rating)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-white"
                  : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
              }`}
              aria-label={`${rating} sao`}
              aria-pressed={isSelected}
            >
              {rating}
              <Icon 
                name="star" 
                filled={true} 
                size={16} 
                className={isSelected ? "text-amber-300" : "text-amber-400"} 
              />
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default StarRatingFilter;
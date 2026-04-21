import React, { memo } from 'react';
import Icon from '@/components/ui/Icon';

const StarRatingFilter = memo(({ value, onChange }) => {
  const handleStarClick = (rating) => {
    // Toggle off if clicking the same rating
    if (value === rating) {
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Xếp hạng đánh giá
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isSelected = value === rating;
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
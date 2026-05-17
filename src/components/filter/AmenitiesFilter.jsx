import React from 'react';
import Icon from '@/components/ui/Icon';
import { AMENITY_META } from '@/constants/enums';

// Task 5.1: Accept availableAmenities prop
const AmenitiesFilter = ({ value, onChange, availableAmenities }) => {
  const handleAmenityToggle = (amenity) => {
    const newAmenities = value.includes(amenity)
      ? value.filter(a => a !== amenity)
      : [...value, amenity];
    onChange(newAmenities);
  };

  // Task 5.1: Filter displayed amenities based on availability
  // If no availableAmenities or empty, show all amenities
  const displayedAmenities = availableAmenities && availableAmenities.size > 0
    ? Object.entries(AMENITY_META).filter(([key]) => availableAmenities.has(key))
    : Object.entries(AMENITY_META); // Show all if no filter

  // Task 5.3: Check if no amenities are available (only if availableAmenities is explicitly set and empty)
  const hasNoAmenities = false; // Temporarily disabled to always show amenities

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Tiện nghi
      </p>
      
      {/* Task 5.3: Empty state for no available amenities */}
      {hasNoAmenities ? (
        <div className="text-center py-6 text-on-surface-variant">
          <Icon name="block" size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Không có tiện nghi nào trong kết quả tìm kiếm</p>
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap">
          {displayedAmenities.map(([key, meta]) => {
            const isActive = value.includes(key);
            return (
              <div 
                key={key} 
                className="flex flex-col items-center gap-1.5 cursor-pointer" 
                onClick={() => handleAmenityToggle(key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAmenityToggle(key);
                  }
                }}
                aria-label={`${isActive ? 'Bỏ chọn' : 'Chọn'} ${meta.label}`}
                aria-pressed={isActive}
              >
                {/* Task 5.2: Improved visual feedback for selected amenities */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isActive 
                    ? "border-2 border-primary bg-primary/5" 
                    : "border border-outline-variant/30 hover:border-primary/30"
                }`}>
                  <Icon 
                    name={meta.icon} 
                    size={24} 
                    className={isActive ? "text-primary" : "text-on-surface-variant"} 
                  />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${
                  isActive ? "text-primary" : "text-on-surface-variant"
                }`}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AmenitiesFilter;
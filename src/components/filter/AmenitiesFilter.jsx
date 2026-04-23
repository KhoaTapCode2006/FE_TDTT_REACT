import React from 'react';
import Icon from '@/components/ui/Icon';
import { AMENITY_META } from '@/constants/enums';

const AmenitiesFilter = ({ value, onChange }) => {
  const handleAmenityToggle = (amenity) => {
    const newAmenities = value.includes(amenity)
      ? value.filter(a => a !== amenity)
      : [...value, amenity];
    onChange(newAmenities);
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Tiện nghi
      </p>
      <div className="flex gap-4 flex-wrap">
        {Object.entries(AMENITY_META).map(([key, meta]) => {
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
              <div className={`amenity-circle ${isActive ? "active" : ""}`}>
                <Icon 
                  name={meta.icon} 
                  size={24} 
                  className={isActive ? "text-white" : "text-on-surface-variant"} 
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
    </div>
  );
};

export default AmenitiesFilter;
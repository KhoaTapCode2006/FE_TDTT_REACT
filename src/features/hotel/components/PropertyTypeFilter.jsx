import React from 'react';
import Icon from '@/components/ui/Icon';
import { PROPERTY_TYPES } from '@/constants/enums';

const PropertyTypeFilter = ({ value, onChange }) => {
  const handleTypeToggle = (type) => {
    const newTypes = value.includes(type)
      ? value.filter(t => t !== type)
      : [...value, type];
    onChange(newTypes);
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Loại hình lưu trú
      </p>
      <div className="grid grid-cols-3 gap-2">
        {PROPERTY_TYPES.map((type) => {
          const isActive = value.includes(type);
          return (
            <label 
              key={type} 
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                isActive 
                  ? "bg-primary/10 border border-primary/30" 
                  : "bg-surface-container-low border border-transparent hover:bg-surface-container-high"
              }`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center flex-none border-2 transition-colors ${
                isActive 
                  ? "bg-primary border-primary" 
                  : "border-outline-variant bg-white"
              }`}>
                {isActive && <Icon name="check" size={14} className="text-white" />}
              </div>
              <span className="text-sm font-medium">{type}</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => handleTypeToggle(type)}
                className="sr-only"
                aria-label={`Chọn ${type}`}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default PropertyTypeFilter;
import React from 'react';
import { PRICE_PRESETS } from '@/constants/enums';

const PriceRangeFilter = ({ priceMin, priceMax, onChange }) => {
  const handlePresetSelect = (preset) => {
    onChange({
      priceMin: preset.min,
      priceMax: preset.max
    });
  };

  // Check if current selection matches a preset
  const getActivePreset = () => {
    return PRICE_PRESETS.find(preset => 
      preset.min === priceMin && preset.max === priceMax
    );
  };

  const activePreset = getActivePreset();

  // Format display range
  const formatRange = () => {
    if (priceMin === null && priceMax === null) {
      return "0 - 100 Triệu";
    }
    
    const formatPrice = (price) => {
      if (price === null) return "";
      if (price >= 1000000) return `${(price / 1000000).toFixed(0)}`;
      return `${(price / 1000000).toFixed(1)}`;
    };

    const minStr = priceMin === null ? "0" : formatPrice(priceMin);
    const maxStr = priceMax === null ? "100" : formatPrice(priceMax);
    
    return `${minStr} - ${maxStr} Triệu`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          Khoảng giá (VNĐ)
        </p>
        <span className="text-sm font-bold text-primary">
          {formatRange()}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRICE_PRESETS.map((preset) => {
          const isActive = activePreset && activePreset.label === preset.label;
          return (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                isActive 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high text-on-surface"
              }`}
              aria-label={`Chọn khoảng giá ${preset.label}`}
              aria-pressed={isActive}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PriceRangeFilter;
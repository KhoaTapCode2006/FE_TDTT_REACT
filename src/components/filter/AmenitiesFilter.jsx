import React from 'react';
import Icon from '@/components/ui/Icon';
import { AMENITY_META } from '@/constants/enums';

// 1. HÀM HELPER: Chuẩn hóa mọi biến thể chữ từ Backend về Key cố định của Frontend
const normalizeAmenityKey = (str) => {
  if (!str) return '';
  const normalized = str.toLowerCase();
  
  // Áp dụng so khớp từ khóa thông minh chống lệch dữ liệu
if (normalized === 'free wi-fi' || normalized === 'wi-fi' || normalized === 'wifi') return 'wifi';
        if (normalized === 'pool' || normalized === 'hồ bơi' || normalized === 'bể bơi' || normalized === 'swimming pool') return 'pool';
        if (normalized === 'gym' || normalized === 'fitness center' || normalized === 'fitness_center' || normalized === 'phòng gym') return 'fitness_center';
        if (normalized === 'spa') return 'spa';
        if (normalized === 'restaurant' || normalized === 'nhà hàng') return 'restaurant';
        if (normalized === 'bar' || normalized === 'quầy bar') return 'bar';
        if (normalized === 'free breakfast' || normalized === 'ăn sáng' || normalized === 'breakfast') return 'breakfast';
        if (normalized === 'free parking' || normalized === 'đỗ xe' || normalized === 'bãi đỗ xe' || normalized === 'parking') return 'parking';
        if (normalized === 'air conditioning' || normalized === 'điều hòa' || normalized === 'máy lạnh' || normalized === 'ac') return 'ac';
        if (normalized === 'pet friendly' || normalized === 'pet_friendly' || normalized === 'thú cưng') return 'pet_friendly';
        if (normalized === 'full-service laundry' || normalized === 'giặt ủi' || normalized === 'laundry') return 'laundry';
        if (normalized === 'airport shuttle' || normalized === 'shuttle' || normalized === 'đưa đón') return 'shuttle';
        if (normalized === 'kitchen' || normalized === 'bếp') return 'kitchen';
  
        if (normalized.includes('wi-fi') || normalized.includes('wifi')) return 'wifi';
        if (normalized.includes('pool') || normalized.includes('hồ bơi') || normalized.includes('bể bơi')) return 'pool';
        if (normalized.includes('gym') || normalized.includes('fitness')) return 'fitness_center';
        if (normalized.includes('spa')) return 'spa';
        if (normalized.includes('restaurant') || normalized.includes('nhà hàng')) return 'restaurant';
        if (normalized.includes('bar') || normalized.includes('quầy bar')) return 'bar';
        if (normalized.includes('breakfast') || normalized.includes('ăn sáng')) return 'breakfast';
        if (normalized.includes('parking') || normalized.includes('đỗ xe')) return 'parking';
        if (normalized.includes('air conditioning') || normalized.includes('điều hòa') || normalized.includes('ac')) return 'ac';
        if (normalized.includes('pet') || normalized.includes('thú cưng')) return 'pet_friendly';
        if (normalized.includes('laundry') || normalized.includes('giặt')) return 'laundry';
        if (normalized.includes('shuttle') || normalized.includes('đưa đón')) return 'shuttle';
        if (normalized.includes('kitchen') || normalized.includes('bếp')) return 'kitchen';
  
        return normalized; // Fallback giữ nguyên nếu là chuỗi khác
};

const AmenitiesFilter = ({ value, onChange, availableAmenities }) => {
  const handleAmenityToggle = (amenity) => {
    const newAmenities = value.includes(amenity)
      ? value.filter(a => a !== amenity)
      : [...value, amenity];
    onChange(newAmenities);
  };

  // Task 5.1: Chuẩn hóa toàn bộ tập hợp availableAmenities nhận về từ backend thành Set các Frontend Keys
  const normalizedAvailable = React.useMemo(() => {
    if (!availableAmenities) return new Set();
    const set = new Set();
    availableAmenities.forEach(amenity => {
      const normalizedKey = normalizeAmenityKey(amenity);
      if (normalizedKey) {
        set.add(normalizedKey);
      }
    });
    return set;
  }, [availableAmenities]);

  // Lọc các tiện nghi hiển thị dựa trên danh sách đã được đồng bộ chuẩn hóa
  const displayedAmenities = availableAmenities && availableAmenities.size > 0
    ? Object.entries(AMENITY_META).filter(([key]) => normalizedAvailable.has(key))
    : Object.entries(AMENITY_META); // Hiển thị tất cả nếu không có bộ lọc có sẵn

  // Task 5.3: Kiểm tra trạng thái trống (Nếu có truyền availableAmenities nhưng sau khi tối ưu lại trống trơn)
  const hasNoAmenities = availableAmenities && availableAmenities.size > 0 && normalizedAvailable.size === 0;

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
        Tiện nghi
      </p>
      
      {/* Task 5.3: Render Empty state cho phần tiện nghi */}
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
                {/* Task 5.2: Phản hồi UI chất lượng cao khi Active */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isActive 
                    ? "border-2 border-primary bg-primary/5 shadow-sm" 
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
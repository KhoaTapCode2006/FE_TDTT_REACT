import React from 'react';
import Icon from '@/components/ui/Icon';
import Toggle from '@/components/ui/Toggle';

const AvailableRoomsFilter = ({ value, onChange }) => {
  return (
    <div className="flex items-center justify-between bg-surface-container-low rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <Icon name="event_available" className="text-green-600" size={22} />
        <span className="text-sm font-semibold">Chỉ hiển thị phòng còn trống</span>
      </div>
      <Toggle 
        value={value} 
        onChange={onChange}
        aria-label="Chỉ hiển thị phòng còn trống"
      />
    </div>
  );
};

export default AvailableRoomsFilter;
import React, { createContext, useState, useContext } from 'react';
import { MOCK_HOTELS } from '@/constants/enums';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [location, setLocation] = useState("Ho Chi Minh City, Vietnam");
  
  // Tọa độ mặc định (Chợ Bến Thành, TP.HCM) để bản đồ không bị trắng
  const [userLoc, setUserLoc] = useState({ lat: 10.7719, lng: 106.6983 }); 

  const [dates, setDates] = useState({
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });

  const [guests, setGuests] = useState({ adults: 2, children: 0, childrenAges: [] });
  
  // Sử dụng MOCK_HOTELS để demo popup
  const [hotels, setHotels] = useState(MOCK_HOTELS);
  const [loading, setLoading] = useState(false);
  const [activeHotel, setActiveHotel] = useState(null);

  // PHẢI CÓ DÒNG NÀY: Fix lỗi "NaN km" trên giao diện
  const [radiusM, setRadiusM] = useState(3000); 

  const value = {
    location, setLocation,
    userLoc, setUserLoc,     // Thêm vào đây
    dates, setDates,
    guests, setGuests,
    hotels, setHotels,
    loading, setLoading,
    activeHotel, setActiveHotel,
    radiusM, setRadiusM      // Thêm vào đây
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
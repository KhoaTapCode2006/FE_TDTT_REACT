import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [location, setLocation] = useState("Ho Chi Minh City, Vietnam");
  const [dates, setDates] = useState({
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });
  const [guests, setGuests] = useState({ adults: 2, children: 0, childrenAges: [] });
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeHotel, setActiveHotel] = useState(null);

  const value = {
    location, setLocation,
    dates, setDates,
    guests, setGuests,
    hotels, setHotels,
    loading, setLoading,
    activeHotel, setActiveHotel
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
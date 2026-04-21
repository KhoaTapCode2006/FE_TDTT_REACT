import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { MOCK_HOTELS, DEFAULT_FILTER_STATE } from '@/constants/enums';
import { transformBackendResponse } from '@/services/backend/backend-data.service';

const AppContext = createContext();

// localStorage key for filter persistence
const FILTER_STORAGE_KEY = 'hotel-filter-state';

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

  // Filter state management with localStorage persistence
  const [filters, setFiltersState] = useState(() => {
    // Try to restore from localStorage on initialization
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the structure to ensure it matches DEFAULT_FILTER_STATE
        if (typeof parsed === 'object' && parsed !== null) {
          return { ...DEFAULT_FILTER_STATE, ...parsed };
        }
      }
    } catch (error) {
      console.warn('Failed to restore filter state from localStorage:', error);
    }
    return DEFAULT_FILTER_STATE;
  });

  // Custom setFilters that also saves to localStorage
  const setFilters = (newFilters) => {
    const filtersToSave = typeof newFilters === 'function' 
      ? newFilters(filters) 
      : newFilters;
    
    setFiltersState(filtersToSave);
    
    // Save to localStorage
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.warn('Failed to save filter state to localStorage:', error);
    }
  };

  // Filter management functions
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  // Computed property to check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.starRating !== null ||
           filters.types.length > 0 ||
           filters.amenities.length > 0 ||
           filters.priceMin !== null ||
           filters.priceMax !== null ||
           filters.availableOnly;
  }, [filters]);

  // Computed property to count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.starRating !== null) count++;
    if (filters.types.length > 0) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.priceMin !== null || filters.priceMax !== null) count++;
    if (filters.availableOnly) count++;
    return count;
  }, [filters]);

  // Load backend data on mount
  useEffect(() => {
    // Dynamic import để tránh circular dependency
    import('@/constants/mock-backend-data').then(module => {
      const MOCK_BACKEND_DATA = module.MOCK_BACKEND_DATA;
      if (MOCK_BACKEND_DATA && MOCK_BACKEND_DATA.data) {
        const transformedHotels = transformBackendResponse(MOCK_BACKEND_DATA);
        console.log('✅ Loaded backend data, hotels count:', transformedHotels.length);
        setHotels(transformedHotels);
      }
    }).catch(err => {
      console.warn('Note: Using MOCK_HOTELS from constants');
      // Fallback to MOCK_HOTELS is already set
    });
  }, []);

  // Clear filters when location changes (URL state synchronization)
  useEffect(() => {
    const handleLocationChange = () => {
      // Clear filters when navigating to a different location
      // This prevents filters from persisting across different searches
      clearFilters();
    };

    // Listen for location changes (if using React Router)
    // For now, we'll just clear filters when the location state changes
    // This can be enhanced with proper URL parameter synchronization
    
    return () => {
      // Cleanup if needed
    };
  }, [location]);
  // Cluster hotels state for sidebar integration
  const [clusterHotels, setClusterHotels] = useState([]);

  // Hovered hotel ID for map marker highlighting
  const [hoveredHotelId, setHoveredHotelId] = useState(null);

  const value = {
    location, setLocation,
    userLoc, setUserLoc,     // Thêm vào đây
    dates, setDates,
    guests, setGuests,
    hotels, setHotels,
    loading, setLoading,
    activeHotel, setActiveHotel,
    radiusM, setRadiusM,     // Thêm vào đây
    // Filter state and functions
    filters, setFilters,
    updateFilter, clearFilters,
    hasActiveFilters, activeFilterCount,
    radiusM, setRadiusM,      // Thêm vào đây
    clusterHotels, setClusterHotels,
    hoveredHotelId, setHoveredHotelId
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
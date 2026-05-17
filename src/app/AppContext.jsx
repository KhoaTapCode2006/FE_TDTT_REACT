import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { MOCK_HOTELS, DEFAULT_FILTER_STATE, AMENITY_META } from '@/constants/enums';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { geolocationService } from '../services/geolocation.service.js';

const AppContext = createContext();

// localStorage key for filter persistence
const FILTER_STORAGE_KEY = 'hotel-filter-state';

const AppContextProvider = ({ children }) => {
  // Location state with GPS and ref_id fields (Task 1.1 - Requirement 6.1, 6.2, 8.1, 8.2)
  const [location, setLocation] = useState({
    address: "Ho Chi Minh City, Vietnam",
    display: "Ho Chi Minh City, Vietnam",
    gps: {
      latitude: 10.7719,
      longitude: 106.6983,
      geohash: ''
    },
    ref_id: ''
  });
  
  // Tọa độ mặc định (Chợ Bến Thành, TP.HCM) để bản đồ không bị trắng
  const [userLoc, setUserLoc] = useState({ lat: 10.7719, lng: 106.6983 }); 

  const [dates, setDates] = useState({
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  });

  const [guests, setGuests] = useState({ adults: 2, children: 0, childrenAges: [] });
  
  // Client-side filtering state (Task 1.1 - Requirement 4.1, 4.2, 5.1)
  const [hotels, setHotels] = useState([]); // Unfiltered API results
  const [filteredHotels, setFilteredHotels] = useState([]); // Client-filtered results
  const [availableAmenities, setAvailableAmenities] = useState(new Set()); // Dynamic amenity tracking
  
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

  // Client-side filter application function (Task 1.2 - Requirement 4.1, 4.3)
  const applyFilters = useCallback((hotelsToFilter, currentFilters) => {
    try {
      // Validate input
      if (!Array.isArray(hotelsToFilter)) {
        console.error('Invalid hotels array:', hotelsToFilter);
        return [];
      }

      let filtered = [...hotelsToFilter];

      // Star rating filter - hotel must have rating >= selected star rating
      if (currentFilters.starRating !== null && typeof currentFilters.starRating === 'number') {
        filtered = filtered.filter(hotel => {
          const hotelStarRating = hotel?.starRating || 0;
          return hotelStarRating >= currentFilters.starRating;
        });
      }

      // Property type filter - hotel type must be in selected types
      if (Array.isArray(currentFilters.types) && currentFilters.types.length > 0) {
        filtered = filtered.filter(hotel => {
          const hotelType = hotel?.type || '';
          return currentFilters.types.includes(hotelType);
        });
      }

      // Amenities filter (AND logic - hotel must have ALL selected amenities)
      if (Array.isArray(currentFilters.amenities) && currentFilters.amenities.length > 0) {
        filtered = filtered.filter(hotel => {
          const hotelAmenities = Array.isArray(hotel?.amenities) ? hotel.amenities : [];
          // Check if hotel has ALL selected amenities
          return currentFilters.amenities.every(amenity => 
            hotelAmenities.includes(amenity)
          );
        });
      }

      // Price range filter - minimum price
      if (currentFilters.priceMin !== null && typeof currentFilters.priceMin === 'number') {
        filtered = filtered.filter(hotel => {
          const hotelPrice = hotel?.pricePerNight || 0;
          return hotelPrice >= currentFilters.priceMin;
        });
      }

      // Price range filter - maximum price
      if (currentFilters.priceMax !== null && typeof currentFilters.priceMax === 'number') {
        filtered = filtered.filter(hotel => {
          const hotelPrice = hotel?.pricePerNight || 0;
          return hotelPrice <= currentFilters.priceMax;
        });
      }

      // Available rooms filter - only show hotels with available rooms
      if (currentFilters.availableOnly === true) {
        filtered = filtered.filter(hotel => {
          // Check both 'available' boolean flag and 'availableRooms' count
          const isAvailable = hotel?.available === true;
          const hasAvailableRooms = (hotel?.availableRooms || 0) > 0;
          return isAvailable || hasAvailableRooms;
        });
      }

      return filtered;

    } catch (error) {
      console.error('Error applying filters:', error);
      // Return unfiltered results on error to prevent breaking the UI
      return hotelsToFilter;
    }
  }, []);

  // Amenity extraction function (Task 1.3 - Requirement 5.1, 5.2, 5.6)
  const extractAvailableAmenities = useCallback((hotelList) => {
    const amenitiesSet = new Set();
    
    // Handle empty or invalid hotel list
    if (!Array.isArray(hotelList) || hotelList.length === 0) {
      return amenitiesSet;
    }
    
    hotelList.forEach(hotel => {
      // Handle hotels with no amenities gracefully
      if (Array.isArray(hotel?.amenities)) {
        hotel.amenities.forEach(amenity => {
          // Only add amenities that exist in AMENITY_META
          if (AMENITY_META[amenity]) {
            amenitiesSet.add(amenity);
          }
        });
      }
    });
    
    return amenitiesSet;
  }, []);

  // Load mock backend data on mount for demo purposes
  // DISABLED: HomePage now loads data from sample_output_2.json via loadMockHotels()
  // useEffect(() => {
  //   // Load mock data for initial demo
  //   const loadMockData = async () => {
  //     try {
  //       // Dynamic import để tránh circular dependency
  //       const module = await import('@/constants/mock-backend-data');
  //       const MOCK_BACKEND_DATA = module.MOCK_BACKEND_DATA;
  //       
  //       if (MOCK_BACKEND_DATA && MOCK_BACKEND_DATA.data) {
  //         // Use the normalizeHotelResult function from utils/format.js
  //         const { normalizeHotelResult } = await import('@/utils/format');
  //         const transformedHotels = MOCK_BACKEND_DATA.data.map((hotel, index) => 
  //           normalizeHotelResult(hotel, location)
  //         ).filter(Boolean);
  //         
  //         console.log('✅ Loaded mock backend data, hotels count:', transformedHotels.length);
  //         setHotels(transformedHotels);
  //       }
  //     } catch (err) {
  //       console.warn('Note: Using MOCK_HOTELS from constants as fallback');
  //       // Fallback to MOCK_HOTELS
  //       setHotels(MOCK_HOTELS);
  //     }
  //   };
  //
  //   loadMockData();
  // }, [location]);

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
  }, [location, clearFilters]);

  // Task 1.4: Auto-apply filters when hotels or filters change (Requirement 4.1, 4.5)
  useEffect(() => {
    const filtered = applyFilters(hotels, filters);
    setFilteredHotels(filtered);
  }, [hotels, filters, applyFilters]);

  // Task 1.4: Extract amenities when hotels change (Requirement 5.3)
  useEffect(() => {
    if (hotels.length > 0) {
      const amenities = extractAvailableAmenities(hotels);
      setAvailableAmenities(amenities);
    } else {
      setAvailableAmenities(new Set());
    }
  }, [hotels, extractAvailableAmenities]);

  // Cluster hotels state for sidebar integration
  const [clusterHotels, setClusterHotels] = useState([]);

  // Hovered hotel ID for map marker highlighting
  const [hoveredHotelId, setHoveredHotelId] = useState(null);

  // Request user geolocation on app load (Task 7.1)
  useEffect(() => {
    const initializeGeolocation = async () => {
      try {
        console.log('🌍 Requesting user geolocation...');
        const location = await geolocationService.requestUserLocation();
        
        // Update user location state with obtained coordinates
        setUserLoc({
          lat: location.latitude,
          lng: location.longitude
        });
        
        console.log('✅ User location set:', location);
      } catch (error) {
        console.error('Failed to get user location:', error);
        // userLoc already has default value, no need to set again
      }
    };

    initializeGeolocation();
  }, []); // Run once on mount

  const value = {
    location, setLocation,
    userLoc, setUserLoc,
    dates, setDates,
    guests, setGuests,
    hotels, setHotels,
    filteredHotels, setFilteredHotels, // Client-filtered results (Task 1.1)
    availableAmenities, setAvailableAmenities, // Dynamic amenity tracking (Task 1.1)
    loading, setLoading,
    activeHotel, setActiveHotel,
    radiusM, setRadiusM,
    // Filter state and functions
    filters, setFilters,
    updateFilter, clearFilters,
    applyFilters, // Client-side filter application (Task 1.2)
    extractAvailableAmenities, // Amenity extraction function (Task 1.3)
    hasActiveFilters, activeFilterCount,
    // Cluster and hover state
    clusterHotels, setClusterHotels,
    hoveredHotelId, setHoveredHotelId
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Enhanced AppProvider with Authentication
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <AppContextProvider>
        {children}
      </AppContextProvider>
    </AuthProvider>
  );
};

export const useApp = () => useContext(AppContext);

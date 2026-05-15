import { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from '@/components/search/SearchBar';
import HotelSidebar from '@/components/hotel/components/HotelSidebar';
import FilterModal from '@/components/filter/FilterModal';
import VietMapPanel from '@/components/map/VietMapPanel'; 
import ErrorBoundary from '@/components/ErrorBoundary';
import Icon from '@/components/ui/Icon';
import Splitter from '@/components/ui/Splitter';
import { useApp } from '@/app/AppContext';
import { searchHotels } from '@/services/backend/hotel.service';
import { loadMockHotels } from '@/services/backend/hotelData.service';


const HomePage = () => {
  const { 
    activeHotel, setActiveHotel, 
    filters, setFilters,
    location, dates, guests, radiusM,
    setHotels, setLoading
  } = useApp();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [mockDataLoading, setMockDataLoading] = useState(true);
  
  // Layout state for splitter
  const [splitterPosition, setSplitterPosition] = useState(50);
  const [mapWidth, setMapWidth] = useState(50);
  const [hotelListWidth, setHotelListWidth] = useState(50);
  const [layoutMode, setLayoutMode] = useState('list');
  
  // Debouncing and request cancellation
  const debounceTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);

  // Load mock hotels on component mount
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setMockDataLoading(true);
        setError(null);
        
        const hotels = await loadMockHotels();
        
        if (hotels.length === 0) {
          setError('Không thể tải dữ liệu khách sạn. Vui lòng thử lại sau.');
        } else {
          setHotels(hotels);
        }
      } catch (err) {
        console.error('Error loading mock hotels:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu khách sạn. Vui lòng làm mới trang.');
      } finally {
        setMockDataLoading(false);
      }
    };

    loadHotels();
  }, []); // Empty dependency array - load only on mount

  // Restore layout state from session storage on mount
  useEffect(() => {
    const restoreLayoutState = () => {
      try {
        const savedLayout = sessionStorage.getItem('homepage-layout');
        if (savedLayout) {
          const layoutState = JSON.parse(savedLayout);
          if (layoutState.splitterPosition !== undefined) {
            setSplitterPosition(layoutState.splitterPosition);
            setMapWidth(layoutState.splitterPosition);
            setHotelListWidth(100 - layoutState.splitterPosition);
            
            // Calculate layout mode based on restored position
            const mode = layoutState.splitterPosition < 40 ? 'grid' : 'list';
            setLayoutMode(mode);
          }
        }
      } catch (err) {
        console.error('Error restoring layout state:', err);
        // Silently fail - use default layout
      }
    };

    restoreLayoutState();
  }, []);

  // Save layout state to session storage
  const saveLayoutState = useCallback((position) => {
    try {
      const layoutState = {
        splitterPosition: position,
        timestamp: Date.now()
      };
      sessionStorage.setItem('homepage-layout', JSON.stringify(layoutState));
    } catch (err) {
      console.error('Error saving layout state:', err);
      // Silently fail - layout won't persist
    }
  }, []);

  // Handle splitter drag events
  const handleSplitterDrag = useCallback((position) => {
    setSplitterPosition(position);
    setMapWidth(position);
    setHotelListWidth(100 - position);
    
    // Calculate layout mode: grid if map < 40%, list if >= 40%
    const mode = position < 40 ? 'grid' : 'list';
    setLayoutMode(mode);
    
    // Save layout state
    saveLayoutState(position);
  }, [saveLayoutState]);

  const performHotelSearch = useCallback(async (searchFilters) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Cancel previous request if it exists
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
      }
      
      // Create new request tracker
      const requestTracker = { cancelled: false };
      currentRequestRef.current = requestTracker;
      
      // Convert price filter to priceRange format
      const priceRange = {};
      if (searchFilters.priceMin !== null) priceRange.minPrice = searchFilters.priceMin;
      if (searchFilters.priceMax !== null) priceRange.maxPrice = searchFilters.priceMax;
      
      const results = await searchHotels({
        location,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests,
        priceRange,
        radius: radiusM,
        filters: searchFilters
      });
      
      // Only update state if request wasn't cancelled
      if (!requestTracker.cancelled) {
        setHotels(results);
        
        // Reset active hotel when results change
        if (activeHotel) {
          setActiveHotel(null);
        }
      }
    } catch (error) {
      if (!currentRequestRef.current?.cancelled) {
        console.error('Error applying filters:', error);
        
        // Set user-friendly error message
        let errorMessage = 'Có lỗi xảy ra khi tìm kiếm khách sạn. Vui lòng thử lại.';
        
        if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
          errorMessage = 'Không thể kết nối mạng. Vui lòng kiểm tra kết nối internet.';
        } else if (error.response?.status === 429) {
          errorMessage = 'Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Máy chủ đang bận. Vui lòng thử lại sau ít phút.';
        }
        
        setError(errorMessage);
      }
    } finally {
      if (!currentRequestRef.current?.cancelled) {
        setLoading(false);
      }
    }
  }, [location, dates, guests, radiusM, setHotels, setLoading, activeHotel, setActiveHotel]);

  const debouncedHotelSearch = useCallback((searchFilters) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout with minimum delay
    debounceTimeoutRef.current = setTimeout(() => {
      performHotelSearch(searchFilters);
    }, 300); // 300ms debounce delay
  }, [performHotelSearch]);

  const handleFilterApply = async (newFilters) => {
    setFilters(newFilters);
    setFilterModalOpen(false);
    
    // Use debounced search to prevent excessive API calls
    debouncedHotelSearch(newFilters);
  };

  const handleRetry = async () => {
    setError(null);
    
    // If mock data failed to load, retry loading it
    if (mockDataLoading === false) {
      try {
        setMockDataLoading(true);
        const hotels = await loadMockHotels();
        
        if (hotels.length === 0) {
          setError('Không thể tải dữ liệu khách sạn. Vui lòng thử lại sau.');
        } else {
          setHotels(hotels);
        }
      } catch (err) {
        console.error('Error loading mock hotels:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu khách sạn. Vui lòng làm mới trang.');
      } finally {
        setMockDataLoading(false);
      }
    } else {
      // Otherwise, retry the filter search
      debouncedHotelSearch(filters);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Thanh tìm kiếm nằm trên cùng */}
      <SearchBar />

      {/* Loading State for Mock Data */}
      {mockDataLoading && (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-text-secondary">Đang tải dữ liệu khách sạn...</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && !mockDataLoading && (
        <div className="bg-error/10 border-l-4 border-error px-4 py-3 mx-4 mt-2 rounded-r-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="error" size={20} className="text-error" />
            <div>
              <p className="text-sm font-medium text-error">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetry}
              className="text-xs font-bold text-error hover:text-error/80 px-3 py-1 rounded-md hover:bg-error/5 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => setError(null)}
              className="text-error/60 hover:text-error p-1 rounded-md hover:bg-error/5 transition-colors"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Vùng nội dung chính: Chia đôi Bản đồ và Sidebar */}
      {!mockDataLoading && (
        <main className="flex-1 flex overflow-hidden relative min-h-0">
          {/* Bản đồ bên trái */}
          <div 
            className="min-w-0 transition-all duration-200"
            style={{ width: `${mapWidth}%` }}
          >
            <ErrorBoundary>
              <VietMapPanel />
            </ErrorBoundary>
          </div>

          {/* Splitter */}
          <Splitter
            initialPosition={splitterPosition}
            minLeftWidth={30}
            minRightWidth={300}
            onPositionChange={handleSplitterDrag}
          />

          {/* Sidebar bên phải */}
          <div 
            className="flex-shrink-0 transition-all duration-200"
            style={{ width: `${hotelListWidth}%` }}
          >
            <HotelSidebar 
              onFilterOpen={() => setFilterModalOpen(true)}
              layoutMode={layoutMode}
              mapWidth={mapWidth}
            />
          </div>
        </main>
      )}

      {/* 3. Filter Modal */}
      {filterModalOpen && (
        <FilterModal
          isOpen={filterModalOpen}
          filters={filters}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleFilterApply}
        />
      )}
    </div>
  );
};

export default HomePage;
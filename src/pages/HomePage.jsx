import { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from '@/components/search/SearchBar';
import HotelSidebar from '@/components/hotel/components/HotelSidebar';
import FilterModal from '@/components/filter/FilterModal';
import VietMapPanel from '@/components/map/VietMapPanel'; 
import ErrorBoundary from '@/components/ErrorBoundary';
import Icon from '@/components/ui/Icon';
import Splitter from '@/components/ui/Splitter';
import { useApp } from '@/app/AppContext';
import { hotelSearchService } from '@/services/backend/hotelSearch.service';


const HomePage = () => {
  const { 
    activeHotel, setActiveHotel, 
    filters, setFilters,
    location, dates, guests, userLoc,
    setHotels, setLoading, setSearchGps
  } = useApp();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Layout state for splitter
  const [splitterPosition, setSplitterPosition] = useState(50);
  const [mapWidth, setMapWidth] = useState(50);
  const [hotelListWidth, setHotelListWidth] = useState(50);
  const [layoutMode, setLayoutMode] = useState('list');
  
  // Debouncing and request cancellation
  const debounceTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);

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
      setError(null); // Xóa lỗi cũ
      
      // Hủy request trước đó nếu có
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
      }
      
      const requestTracker = { cancelled: false };
      currentRequestRef.current = requestTracker;
      
      // 1. Chuẩn hóa chuỗi Address từ global state `location`
      const addressStr = location?.address || location?.display || '';
      
      // 2. Use user's current location for GPS if location.gps is not set
      const gpsData = location?.gps?.latitude && location?.gps?.longitude 
        ? location.gps 
        : { latitude: userLoc.lat, longitude: userLoc.lng, geohash: '' };

      // 3. Trích xuất ref_id
      const refId = location?.ref_id || '';

      // Chốt chặn bảo vệ: Nếu chưa chọn địa điểm hoặc thiếu ngày, không gọi API để tránh lỗi crash validation
      if (!addressStr || !dates?.checkIn || !dates?.checkOut) {
        console.warn('⚠️ Chưa đủ tham số bắt buộc để tìm kiếm:', { addressStr, gpsData, dates });
        setHotels([]);
        setLoading(false);
        return;
      }
      
      // Format dates as ISO strings (YYYY-MM-DD)
      const checkInStr = dates.checkIn.toISOString().split('T')[0];
      const checkOutStr = dates.checkOut.toISOString().split('T')[0];
      
      // Format children as array of ages
      const childrenArray = Array.isArray(guests?.children) 
        ? guests.children 
        : (guests?.children > 0 ? Array(guests.children).fill(0) : []);
      
      // Calculate total party size
      const partySize = (guests?.adults || 2) + childrenArray.length;
      
      // 4. Gọi hàm searchHotels từ đúng hotelSearchService mới
      const response = await hotelSearchService.searchHotels({
        address: addressStr,
        gps: gpsData,
        ref_id: refId,
        check_in: checkInStr,
        check_out: checkOutStr,
        adults: guests?.adults || 2,
        children: childrenArray,
        personality: searchFilters?.personality || '',
        trip_style: 'kham_pha', // Default trip style
        trip_criteria: {
          budget_min: 0,
          budget_max: 0,
          trip_style: 'kham_pha',
          party_size: partySize
        },
        max_ranked_hotels: 50
      });
      
      // Extract hotels and searching_place from response
      const results = response.hotels || response || [];
      const searchingPlace = response.searchingPlace || null;
      
      // Chỉ cập nhật state nếu request không bị hủy giữa chừng
      if (!requestTracker.cancelled) {
        setHotels(results);
        
        // Set map GPS from searching_place if available
        if (searchingPlace && searchingPlace.gps && setSearchGps) {
          console.log('✅ Setting map GPS from searching_place:', searchingPlace.gps);
          setSearchGps({
            latitude: searchingPlace.gps.latitude,
            longitude: searchingPlace.gps.longitude
          });
        }
        
        if (activeHotel) {
          setActiveHotel(null);
        }
      }
    } catch (error) {
      if (!currentRequestRef.current?.cancelled) {
        console.error('Error applying filters:', error);
        
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
  }, [location, dates, guests, userLoc, setHotels, setLoading, activeHotel, setActiveHotel]);

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

  // Task 2.1: Remove filter-triggered API calls
  // Filters now only update AppContext state, client-side filtering happens automatically
  const handleFilterApply = async (newFilters) => {
    setFilters(newFilters);
    setFilterModalOpen(false);
    // NO API call - filtering is done client-side in AppContext
  };

  const handleRetry = async () => {
    setError(null);
    // Retry the hotel search (not filter search)
    debouncedHotelSearch(filters);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Thanh tìm kiếm nằm trên cùng */}
      <SearchBar />

      {/* Error Banner */}
      {error && (
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
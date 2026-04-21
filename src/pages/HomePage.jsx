import { useState, useCallback, useRef } from 'react';
import SearchBar from '@/features/hotel/components/SearchBar';
import HotelSidebar from '@/features/hotel/components/HotelSidebar';
import HotelPopup from '@/features/hotel/components/HotelPopup';
import FilterModal from '@/features/hotel/components/FilterModal';
import ClusterSplitView from '@/features/hotel/components/ClusterSplitView';
import VietMapPanel from '@/features/map/VietMapPanel'; // Huy nhớ bóc tách file này nhé
import ErrorBoundary from '@/components/ErrorBoundary';
import Icon from '@/components/ui/Icon';
import { useApp } from '@/app/AppContext';
import { searchHotels } from '@/services/backend/hotel.service';

const HomePage = () => {
  const { 
    activeHotel, setActiveHotel, 
    filters, setFilters,
    location, dates, guests, radiusM,
    setHotels, setLoading,
    clusterHotels, setClusterHotels
  } = useApp();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Debouncing and request cancellation
  const debounceTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);

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

  const handleRetry = () => {
    setError(null);
    debouncedHotelSearch(filters);
  };

  const handleClosePopup = () => {
    setActiveHotel(null);
    setClusterHotels([]);
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
        {/* Bản đồ bên trái (hoặc nền) */}
        <div className="flex-1 min-w-0">
          <ErrorBoundary>
            <VietMapPanel />
          </ErrorBoundary>
        </div>

        {/* Sidebar bên phải */}
        <HotelSidebar onFilterOpen={() => setFilterModalOpen(true)} />
      </main>

      {/* 3. Conditional rendering: Split-view for clusters, standard popup for single hotels */}
      {clusterHotels && clusterHotels.length > 0 ? (
        <ClusterSplitView />
      ) : activeHotel ? (
        <HotelPopup 
          hotel={activeHotel} 
          onClose={handleClosePopup} 
        />
      ) : null}

      {/* 4. Filter Modal */}
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
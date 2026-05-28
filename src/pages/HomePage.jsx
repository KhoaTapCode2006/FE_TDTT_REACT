import { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from '@/components/search/SearchBar';
import HotelSidebar from '@/components/hotel/components/HotelSidebar';
import FilterModal from '@/components/filter/FilterModal';
import VietMapPanel from '@/components/map/VietMapPanel'; 
import ErrorBoundary from '@/components/ErrorBoundary';
import Icon from '@/components/ui/Icon';
import Splitter from '@/components/ui/Splitter';
import HotelListSection from '@/components/hotel/components/HotelListSection';
import { useApp } from '@/app/AppContext';
import { hotelSearchService } from '@/services/backend/hotelSearch.service';
import { getFavoritePlaces } from '@/services/profile/favorites.service';


const HomePage = () => {
  const { 
    activeHotel, setActiveHotel, 
    filters, setFilters,
    location, dates, guests, userLoc,
    setHotels, setLoading, setSearchGps
  } = useApp();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  // Trạng thái bố cục cho splitter - Bản đồ 30%, Khách sạn 70%
  const [splitterPosition, setSplitterPosition] = useState(20);
  const [mapWidth, setMapWidth] = useState(40);
  const [hotelListWidth, setHotelListWidth] = useState(60);
  const [layoutMode, setLayoutMode] = useState('list');
  
  // Debounce và hủy request
  const debounceTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);

  // Khôi phục trạng thái bố cục từ session storage khi component mount
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
            
            // Tính chế độ bố cục dựa trên vị trí đã khôi phục
            const mode = layoutState.splitterPosition < 40 ? 'grid' : 'list';
            setLayoutMode(mode);
          }
        }
      } catch (err) {
        console.error('Lỗi khôi phục trạng thái bố cục:', err);
        // Không báo lỗi, dùng bố cục mặc định
      }
    };
    restoreLayoutState();
  }, []);

  // Lưu trạng thái bố cục xuống session storage
  const saveLayoutState = useCallback((position) => {
    try {
      const layoutState = {
        splitterPosition: position,
        timestamp: Date.now()
      };
      sessionStorage.setItem('homepage-layout', JSON.stringify(layoutState));
    } catch (err) {
      console.error('Lỗi lưu trạng thái bố cục:', err);
      // Không báo lỗi, bố cục sẽ không được lưu
    }
  }, []);

  // Xử lý sự kiện kéo splitter
  const handleSplitterDrag = useCallback((position) => {
    setSplitterPosition(position);
    setMapWidth(position);
    setHotelListWidth(100 - position);
    
    // Tính chế độ bố cục: grid nếu bản đồ < 40%, list nếu >= 40%
    const mode = position < 40 ? 'grid' : 'list';
    setLayoutMode(mode);
    
    // Lưu trạng thái bố cục
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
      
      // 2. Dùng vị trí hiện tại của người dùng làm GPS nếu location.gps chưa có
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
      
      // Chuyển ngày sang định dạng ISO (YYYY-MM-DD)
      const checkInStr = dates.checkIn.toISOString().split('T')[0];
      const checkOutStr = dates.checkOut.toISOString().split('T')[0];
      
      // Chuyển trẻ em thành mảng độ tuổi
      const childrenArray = Array.isArray(guests?.children) 
        ? guests.children 
        : (guests?.children > 0 ? Array(guests.children).fill(0) : []);
      
      // Tính tổng số người trong đoàn
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
        trip_style: 'kham_pha', // Kiểu chuyến đi mặc định
        trip_criteria: {
          budget_min: 0,
          budget_max: 0,
          trip_style: 'kham_pha',
          party_size: partySize
        },
        max_ranked_hotels: 50
      });
      
      // Lấy hotels và searching_place từ response
      const results = response.hotels || response || [];
      const searchingPlace = response.searchingPlace || null;
      
      // Chỉ cập nhật state nếu request không bị hủy giữa chừng
      if (!requestTracker.cancelled) {
        // Thử lấy danh sách yêu thích của người dùng và gắn nhãn để icon trái tim đồng bộ
        try {
          const favs = await getFavoritePlaces();
          const favSet = new Set(favs.map(f => f.propertyToken || f.id || f.hotelId));
          const annotated = results.map(h => ({ ...h, isFavorited: favSet.has(h.propertyToken || h.id) }));
          setHotels(annotated);
        } catch (err) {
          // Nếu user chưa xác thực hoặc fetch thất bại, dùng kết quả gốc
          console.debug('Không thể lấy danh sách yêu thích (có thể người dùng chưa xác thực):', err?.message || err);
          setHotels(results);
        }
        
        // Cập nhật GPS bản đồ từ searching_place nếu có
        if (searchingPlace && searchingPlace.gps && setSearchGps) {
          console.log('✅ Đã thiết lập GPS bản đồ từ searching_place:', searchingPlace.gps);
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
        console.error('Lỗi khi tìm kiếm khách sạn:', error);
        
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
    // Xóa timeout hiện tại
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Đặt timeout mới với độ trễ tối thiểu
    debounceTimeoutRef.current = setTimeout(() => {
      performHotelSearch(searchFilters);
    }, 300); // độ trễ debounce 300ms
  }, [performHotelSearch]);

  // Nhiệm vụ 2.1: Loại bỏ các lần gọi API do filter kích hoạt
  // Filters giờ chỉ cập nhật state AppContext, lọc trên client tự động
  const handleFilterApply = async (newFilters) => {
    setFilters(newFilters);
    setFilterModalOpen(false);
    // KHÔNG gọi API - lọc được thực hiện trên client trong AppContext
  };

  const handleRetry = async () => {
    setError(null);
    // Thử lại tìm kiếm khách sạn (không phải tìm kiếm filter)
    debouncedHotelSearch(filters);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Thanh tìm kiếm nằm trên cùng */}
      <SearchBar />

      {/* Thanh thông báo lỗi */}
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

          {/* Thanh chia kích thước */}
          <Splitter
            initialPosition={splitterPosition}
            minLeftWidth={30}
            minRightWidth={300}
            onPositionChange={handleSplitterDrag}
          />

          {/* Sidebar bên phải */}
          <div 
            className="flex-shrink-0 h-full transition-all duration-200"
            style={{ width: `${hotelListWidth}%` }}
          >
            <HotelSidebar 
              onFilterOpen={() => setFilterModalOpen(true)}
              layoutMode={layoutMode}
              mapWidth={mapWidth}
            />
          </div>
        </main>

      {/* 3. Hộp thoại bộ lọc */}
      {filterModalOpen && (
        <FilterModal
          isOpen={filterModalOpen}
          filters={filters}
          onClose={() => setFilterModalOpen(false)}
          onApply={handleFilterApply}
        />
      )}
      <div>
        <HotelListSection />
      </div>
    </div>


  );
};

export default HomePage;
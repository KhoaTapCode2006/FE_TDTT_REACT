import SearchBar from '@/features/hotel/components/SearchBar';
import HotelSidebar from '@/features/hotel/components/HotelSidebar';
import HotelPopup from '@/features/hotel/components/HotelPopup';
import VietMapPanel from '@/features/map/VietMapPanel'; // Huy nhớ bóc tách file này nhé
import ErrorBoundary from '@/components/ErrorBoundary';
import { useApp } from '@/app/AppContext';

const HomePage = () => {
  const { activeHotel, setActiveHotel } = useApp();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* 1. Thanh tìm kiếm nằm trên cùng */}
      <SearchBar />

      {/* 2. Vùng nội dung chính: Chia đôi Bản đồ và Sidebar */}
      <main className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Bản đồ bên trái (hoặc nền) */}
        <div className="flex-1 min-w-0">
          <ErrorBoundary>
            <VietMapPanel />
          </ErrorBoundary>
        </div>

        {/* Sidebar bên phải */}
        <HotelSidebar />
      </main>

      {/* 3. Popup chi tiết hiển thị đè lên khi có khách sạn được chọn */}
      {activeHotel && (
        <HotelPopup 
          hotel={activeHotel} 
          onClose={() => setActiveHotel(null)} 
        />
      )}
    </div>
  );
};

export default HomePage;
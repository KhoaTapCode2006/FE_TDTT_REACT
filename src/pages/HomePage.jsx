import SearchBar from '@/features/hotel/components/SearchBar';
import HotelSidebar from '@/features/hotel/components/HotelSidebar';
import HotelPopup from '@/features/hotel/components/HotelPopup';
import ClusterSplitView from '@/features/hotel/components/ClusterSplitView';
import VietMapPanel from '@/features/map/VietMapPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useApp } from '@/app/AppContext';

const HomePage = () => {
  const { activeHotel, setActiveHotel, clusterHotels, setClusterHotels } = useApp();

  const handleClosePopup = () => {
    setActiveHotel(null);
    setClusterHotels([]);
  };

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

      {/* 3. Conditional rendering: Split-view for clusters, standard popup for single hotels */}
      {clusterHotels && clusterHotels.length > 0 ? (
        <ClusterSplitView />
      ) : activeHotel ? (
        <HotelPopup 
          hotel={activeHotel} 
          onClose={handleClosePopup} 
        />
      ) : null}
    </div>
  );
};

export default HomePage;
import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HotelPopup from "@/components/hotel/components/HotelPopup";
import ClusterSplitView from "@/components/hotel/components/ClusterSplitView";
import { useApp } from "@/app/AppContext";

function MainLayout() {
  const { clusterHotels, activeHotel, setActiveHotel } = useApp();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat' || location.pathname.startsWith('/chat/');
  const isTripPage = location.pathname === '/trips' || location.pathname.startsWith('/trips/');
  const isFullscreenPage = isChatPage || isTripPage;

  const handleClosePopup = () => {
    setActiveHotel(null);
  };

  return (
    <div className={`flex flex-col bg-background text-on-background ${isFullscreenPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header />
      <main className={isFullscreenPage ? 'flex flex-1 min-h-0 overflow-hidden' : 'flex-1 min-h-0'}>
        <Outlet />
      </main>
      {!isChatPage && <Footer />}
      
      {/* Global Popups - Render across all pages */}
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
}

export default MainLayout;

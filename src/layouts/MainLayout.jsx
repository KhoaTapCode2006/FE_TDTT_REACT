import { Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HotelPopup from "@/components/hotel/components/HotelPopup";
import ClusterSplitView from "@/components/hotel/components/ClusterSplitView";
import { useApp } from "@/app/AppContext";

function MainLayout() {
  const { clusterHotels, activeHotel, setActiveHotel } = useApp();

  const handleClosePopup = () => {
    setActiveHotel(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Header />
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <Footer />
      
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

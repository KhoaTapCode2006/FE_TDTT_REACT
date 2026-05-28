import { useEffect, useState } from "react";
import { useApp } from "@/app/AppContext";
import HotelCard from "./HotelCard";
import HotelListSection from "./HotelListSection";
import Icon from "@/components/ui/Icon";

function HotelSidebar({ onFilterOpen, layoutMode = 'list', mapWidth = 50 }) {
  // Sử dụng filteredHotels cho client-side filtering
  const { filteredHotels, loading, setActiveHotel, hasActiveFilters, activeFilterCount, clusterHotels, activeHotel } = useApp();
  // Always use vertical list layout (grid removed per UX request)

  const total = filteredHotels.length;
  const hasCluster = clusterHotels && clusterHotels.length > 0;

  // HÀM HỖ TRỢ: Lấy link ảnh an toàn kể cả khi nó là Object hay Chuỗi
  const getHotelImageUrl = (hotel) => {
    if (!hotel || !hotel.images || hotel.images.length === 0) return null;
    const firstImg = hotel.images[0];
    if (typeof firstImg === 'string') return firstImg;
    // Nếu backend trả về mảng Object giống như log dữ liệu mẫu của bạn
    return firstImg?.url || firstImg?.thumbnail || firstImg?.original_image || firstImg?.original || null;
  };

  return (
    <aside className=" max-h-[620px] w-full bg-surface-container-lowest border-l border-outline-variant/20 flex flex-col overflow-hidden h-full">
      <div className="bg-surface-container-lowest/95 backdrop-blur-sm z-10 px-6 pt-6 pb-4 border-b border-outline-variant/10 flex-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Lưu trú được chọn lọc</h2>
            <p className="text-on-surface-variant text-xs mt-0.5">Dành riêng cho bạn</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              {loading ? "…" : total === 0 ? "0 Results" : `${total} Results`}
            </span>
            <button
              type="button"
              onClick={onFilterOpen}
              className="relative flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-3 py-2 rounded-xl font-bold text-xs hover:brightness-95 transition-all active:scale-95"
            >
              <Icon name="tune" size={18} />
              Bộ lọc
              {hasActiveFilters && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                  {activeFilterCount}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-none px-6 pt-6 pb-6" style={{ height: 'calc(100vh - 50px)' }}>
        {loading ? (
          <div className="h-full w-full rounded-4xl bg-surface-container-highest animate-pulse" />
        ) : total === 0 && !hasActiveFilters ? (
          /* HIỂN THỊ NGAY KHI MỚI MỞ TRANG (CHƯA SEARCH, CHƯA FILTER) */
          <div className="h-full overflow-y-auto scrollbar-none">

          </div>
        ) : total === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Icon name="search_off" size={48} className="text-outline" />
            <p className="font-headline font-bold text-lg text-primary">Không tìm thấy lưu trú</p>
            <p className="text-sm text-on-surface-variant">hãy chỉnh sửa bộ lọc hoặc tìm kiếm lại.</p>
          </div>
        ) : hasCluster ? (
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="mb-4">
              <h3 className="font-headline text-lg font-bold text-primary mb-2">Hotels trong khu vực này</h3>
            </div>
            <div className="space-y-2">
              {clusterHotels.map((hotel) => {
                const imgUrl = getHotelImageUrl(hotel);
                return (
                  <button
                    key={hotel.id}
                    onClick={() => setActiveHotel(hotel)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      activeHotel?.id === hotel.id
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant/30 bg-surface-container hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {imgUrl && (
                        <img
                          src={imgUrl}
                          alt={hotel.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm mb-1 truncate ${
                          activeHotel?.id === hotel.id ? 'text-primary' : 'text-on-surface'
                        }`}>
                          {hotel.name}
                        </h4>
                        <p className="text-xs text-on-surface-variant truncate">{hotel.address}</p>
                        <p className="text-xs font-bold text-secondary mt-1">
                          {hotel.pricePerNight ? `${(hotel.pricePerNight / 1000).toFixed(0)}K VND/night` : 'Price N/A'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* List layout - vertical scroll */
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="space-y-4">
              {filteredHotels.map((hotel) => (
                <HotelCard 
                  key={hotel.id} 
                  hotel={hotel} 
                  onClick={setActiveHotel} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default HotelSidebar;
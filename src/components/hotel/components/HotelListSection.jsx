import { useState, useEffect } from 'react';
import HotelCard from './HotelCard';
import IntroHotelCard from './IntroHotelCard';
import { hotelSearchService } from '@/services/backend/hotelSearch.service';
import Icon from '@/components/ui/Icon';
import { useApp } from '@/app/AppContext';


function HotelSliderGroup({ title, subtitle, hotels, onHotelClick, itemsPerPage = 4, accent, hideHeader = false, vertical = false }) {
  const [currentPage, setCurrentPage] = useState(0);

  const totalItems = hotels.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  let displayedHotels;
  if (vertical) {
    displayedHotels = hotels.slice(0, itemsPerPage);
  } else {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    displayedHotels = hotels.slice(startIndex, endIndex);
  }

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      setCurrentPage(0); // Vòng lặp lại trang đầu
    }
  };

  const handlePrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      setCurrentPage(totalPages - 1); // Vòng lặp về trang cuối
    }
  };

  if (totalItems === 0) return null;

  return (
    <div className="mb-6 mt-4">
      {/* Header (hidden if requested) */}
      {!hideHeader && (
        <div className="mb-6">
          <h3 className="font-headline text-2xl font-extrabold text-primary tracking-tight">
            {title}
          </h3>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {subtitle}
          </p>
        </div>
      )}

      <div className="relative w-full group/carousel">
        {vertical ? (
          <div className="flex flex-col gap-4">
            {displayedHotels.map((hotel) => (
                vertical ? (
                  <IntroHotelCard
                    key={`${title}-${hotel.id}`}
                    hotel={hotel}
                    onClick={onHotelClick}
                    compact={true}
                    accent={accent}
                  />
                ) : (
                  <HotelCard
                    key={`${title}-${hotel.id}`}
                    hotel={hotel}
                    onClick={onHotelClick}
                    compact={true}
                    accent={accent}
                  />
                )
              ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(displayedHotels.length, itemsPerPage)}, minmax(0,1fr))` }}>
              {displayedHotels.map((hotel, index) => (
                <HotelCard 
                  key={`${title}-${hotel.id}`}
                  hotel={hotel}
                  onClick={onHotelClick}
                  className="w-full transform transition-all duration-300 hover:-translate-y-1" 
                  accent={accent}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute -left-10 top-1/2 -translate-y-1/2 -translate-x-5 bg-surface hover:bg-surface-container-high text-primary p-3 rounded-full shadow-xl  hover:scale-105 active:scale-95 transition-all z-10 border-2 border-outline-variant/30 pointer-events-auto md:group-hover/carousel:opacity-100 flex items-center justify-center"
                  aria-label="Previous page"
                >
                  <Icon name="chevron_left" size={24} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute -right-10 top-1/2 -translate-y-1/2 translate-x-5 bg-surface hover:bg-surface-container-high text-primary p-3 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all z-10 border border-outline-variant/30 pointer-events-auto md:group-hover/carousel:opacity-100 flex items-center justify-center"
                  aria-label="Next page"
                >
                  <Icon name="chevron_right" size={24} />
                </button>

                <div className="flex justify-center items-center gap-2 mt-6">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentPage(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentPage === index 
                          ? 'w-6 bg-primary' 
                          : 'w-2 bg-outline-variant/60 hover:bg-outline-variant'
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function HotelListSection({
  weeklyLimit = 16,
  showAllTime = true,
  weeklyTitle = 'Trending This Week',
  weeklySubtitle = 'Most viewed hotels by Lodgy4U members this week',
  itemsPerPageLg = 4,
  accent,
  hideHeader = false,
  vertical = false,
}) {
  const [topDataWeekly, setTopDataWeekly] = useState([]);
  const [topDataAllTime, setTopDataAllTime] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    const fetchTopWeekly = async () => {
      try {
        setIsFetching(true);
        const results = await hotelSearchService.getTopViewsHotelsWeekly(weeklyLimit);
        setTopDataWeekly(results || []);
      } catch (error) {
        console.error("Lỗi khi load Top Views:", error);
      } finally {
        setIsFetching(false);
      }
    };

    const fetchTopAllTime = async () => {
      try {
        setIsFetching(true);
        const results = await hotelSearchService.getTopViewsHotelsAllTime(16);
        setTopDataAllTime(results || []);
      } catch (error) {
        console.error("Lỗi khi load Top Views:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchTopWeekly();
    if (showAllTime) {
      fetchTopAllTime();
    }
  }, [weeklyLimit, showAllTime]);

  const { setActiveHotel } = useApp();

  // Sắp xếp theo lượt xem tuần (hoặc lượt xem tổng) nếu cần
  const sortedHotelsWeekly = [...topDataWeekly].sort((a, b) => (b.weeklyViews || 0) - (a.weeklyViews || 0));
  const sortedHotelsAllTime = [...topDataAllTime].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0));

  // 2. TÍNH TOÁN SLICE DATA: Chỉ cắt đúng 4 phần tử tương ứng với trang hiện tại

  if (isFetching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-75 rounded-2xl bg-surface-container-highest animate-pulse" />
        ))}
      </div>
    );
  }

  if (sortedHotelsWeekly.length === 0 && (!showAllTime || sortedHotelsAllTime.length === 0)) return null;

  return (
    <div className="relative w-full group px-4 py-4">
      <HotelSliderGroup 
        title={weeklyTitle}
        subtitle={weeklySubtitle}
        hotels={sortedHotelsWeekly}
        onHotelClick={(h) => setActiveHotel(h)}
        itemsPerPage={itemsPerPageLg}
        accent={accent}
        hideHeader={hideHeader}
        vertical={vertical}
      />

      {showAllTime && sortedHotelsAllTime.length > 0 && (
        <HotelSliderGroup 
          title="All-Time Favorites"
          subtitle="The most popular and highly viewed stays of all time"
          hotels={sortedHotelsAllTime}
          onHotelClick={(h) => setActiveHotel(h)}
          itemsPerPage={itemsPerPageLg}
          accent={accent}
          hideHeader={hideHeader}
          vertical={vertical}
        />
      )}
    </div>

    
  );
}

export default HotelListSection;
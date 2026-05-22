import { useState, useEffect } from 'react';
import HotelCard from './HotelCard';
import { hotelSearchService } from '@/services/backend/hotelSearch.service';
import Icon from '@/components/ui/Icon';
import { useApp } from '@/app/AppContext';


function HotelSliderGroup({ title, subtitle, hotels, onHotelClick }) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const totalItems = hotels.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedHotels = hotels.slice(startIndex, endIndex);

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
    <div className="mb-12 mt-4">
      {/* Tiêu đề riêng cho từng phần */}
      <div className="mb-6">
        <h3 className="font-headline text-2xl font-extrabold text-primary tracking-tight">
          {title}
        </h3>
        <p className="text-on-surface-variant text-sm mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Vùng chứa Slider */}
      <div className="relative w-full group/carousel">
        {/* Grid hiển thị 4 hotel của trang hiện tại thuộc nhóm này */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedHotels.map((hotel, index) => (
            <HotelCard 
              // Key cô lập theo tên nhóm và trang để React cập nhật DOM chính xác
              key={`${title}-${hotel.id}`}
              hotel={hotel}
              onClick={onHotelClick}
              className="w-full transform transition-all duration-300 hover:-translate-y-1" 
            />
          ))}
        </div>

        {/* Thanh điều hướng và Dấu chấm chỉ hiện khi data > 4 */}
        {totalPages > 1 && (
          <>
            {/* Nút Previous */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute -left-10 top-1/2 -translate-y-1/2 -translate-x-5 bg-surface hover:bg-surface-container-high text-primary p-3 rounded-full shadow-xl  hover:scale-105 active:scale-95 transition-all z-10 border-2 border-outline-variant/30 pointer-events-auto md:group-hover/carousel:opacity-100 flex items-center justify-center"
              aria-label="Previous page"
            >
              <Icon name="chevron_left" size={24} />
            </button>

            {/* Nút Next */}
            <button
              type="button"
              onClick={handleNext}
              className="absolute -right-10 top-1/2 -translate-y-1/2 translate-x-5 bg-surface hover:bg-surface-container-high text-primary p-3 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all z-10 border border-outline-variant/30 pointer-events-auto md:group-hover/carousel:opacity-100 flex items-center justify-center"
              aria-label="Next page"
            >
              <Icon name="chevron_right" size={24} />
            </button>
            
            {/* Hàng nút chấm tròn (Dots Indicator) cô lập của nhóm này */}
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
      </div>
    </div>
  );
}

function HotelListSection() {
  const [topDataWeekly, setTopDataWeekly] = useState([]);
  const [topDataAllTime, setTopDataAllTime] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  
  // 1. THAY ĐỔI TẠI ĐÂY: Đặt số lượng hiển thị trên mỗi trang cố định là 4 
  useEffect(() => {
    const fetchTopWeekly = async () => {
      try {
        setIsFetching(true);
        // Lấy khoảng 16 hoặc 20 khách sạn từ backend để chia thành 4-5 trang
        const results = await hotelSearchService.getTopViewsHotelsWeekly(16);
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
        // Lấy khoảng 16 hoặc 20 khách sạn từ backend để chia thành 4-5 trang
        const results = await hotelSearchService.getTopViewsHotelsAllTime(16);
        setTopDataAllTime(results || []);
      } catch (error) {
        console.error("Lỗi khi load Top Views:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchTopWeekly();
    fetchTopAllTime();
  }, []);

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

  if (sortedHotelsWeekly.length === 0 && sortedHotelsAllTime.length === 0) return null;

  return (
    <div className="relative w-full group px-20">
      {/* Grid chứa đúng 4 cột cho 4 khách sạn */}
      <HotelSliderGroup 
        title="Trending This Week"
        subtitle="Most viewed hotels by Lodgy4U members this week"
        hotels={sortedHotelsWeekly}
        onHotelClick={(h) => setActiveHotel(h)}
      />

      {/* Nút điều hướng chuyển trang Trái / Phải (Chỉ hiện khi có nhiều hơn 1 trang) */}
      
      <HotelSliderGroup 
        title="All-Time Favorites"
        subtitle="The most popular and highly viewed stays of all time"
        hotels={sortedHotelsAllTime}
        onHotelClick={(h) => setActiveHotel(h)}
      />

    </div>

    
  );
}

export default HotelListSection;
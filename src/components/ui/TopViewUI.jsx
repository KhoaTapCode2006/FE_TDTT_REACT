import { useRef } from "react";
import HotelCard from "@/components/hotel/components/HotelCard"; 
import Icon from "@/components/ui/Icon";

const HotelCarousel = ({ title, hotels, onHotelClick }) => {
  const carouselRef = useRef(null);

  if (!hotels || hotels.length === 0) return null;

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full my-2 relative group flex flex-col">
      {/* Tiêu đề nhóm */}
      <h3 className="text-sm font-bold mb-2 px-1 text-primary flex items-center gap-1.5">
        {title}
      </h3>
      
      <div className="relative w-full">
        {/* Nút bấm trái */}
        <button 
          onClick={() => scroll("left")} 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-surface text-on-surface p-1.5 rounded-full shadow border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition duration-200"
          type="button"
        >
          <Icon name="chevron_left" size={16} />
        </button>

        {/* Khung trượt ngang an toàn trong Sidebar */}
        <div 
          ref={carouselRef} 
          className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth w-full"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {hotels.map((hotel) => (
            <div 
              key={hotel.id} 
              // SỬA TẠI ĐÂY: w-[280px] cố định giúp card không bị bóp nghẹt thành 90px trong sidebar
              className="w-[280px] flex-shrink-0 snap-start cursor-pointer"
              onClick={() => onHotelClick && onHotelClick(hotel)}
            >
              {/* Truyền prop onClick chuẩn xác cho HotelCard */}
              <HotelCard hotel={hotel} onClick={onHotelClick} />
            </div>
          ))}
        </div>

        {/* Nút bấm phải */}
        <button 
          onClick={() => scroll("right")} 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-surface text-on-surface p-1.5 rounded-full shadow border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition duration-200"
          type="button"
        >
          <Icon name="chevron_right" size={16} />
        </button>
      </div>
    </div>
  );
};

export default HotelCarousel;
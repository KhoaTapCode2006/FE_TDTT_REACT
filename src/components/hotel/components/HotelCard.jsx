import { fmtPrice, fmtPriceExact, formatViewCount } from "@/utils/format";
import { AMENITY_META } from "@/constants/enums";
import Icon from "@/components/ui/Icon";
import { useApp } from "@/app/AppContext";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SaveToCollectionModal from "@/components/profile/SaveToCollectionModal";
import AddToFavoritesButton from "@/components/hotel/AddToFavoritesButton";
import { getImageWithFallback } from "@/utils/imageUtils";
import { useImageCache, markFailedUrl } from "@/hooks/useImageCache";
import viewTrackingService from "@/services/viewTracking.service";

function HotelCard({ hotel, onClick, className = '', accent, compact = false }) {
  const { setHoveredHotelId } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const reviews = hotel?.userReviews || hotel?.reviews || hotel?.user_reviews || [];
  
  // Xử lý hình ảnh: lấy thumbnail/original qua helper
  const firstImage = hotel?.images?.[0];
  const imageUrl = getImageWithFallback(firstImage);
  const { cachedUrl, isLoading: imageLoading, error: imageError } = useImageCache(imageUrl);

  // Dùng placeholder của Google làm fallback ổn định
  const googlePlaceholder = "https://storage.googleapis.com/support-forums-api/attachment/thread-62654029-5647160710799411463.png";
  const displayUrl = cachedUrl || imageUrl || googlePlaceholder;
  
  const amenityIcons = (hotel?.amenities || []).slice(0, 3).map((a) => {
    const meta = AMENITY_META[a];
    return meta ? meta : { icon: "check", label: String(a) };
  });

  const handleSaveClick = (e) => {
    e.stopPropagation(); // Ngăn click vào thẻ
    
    if (!isAuthenticated) {
      // Chuyển đến đăng nhập nếu chưa xác thực
      navigate('/auth/login');
      return;
    }
    
    setShowSaveModal(true);
  };

  const handleCardClick = async () => {
    // Theo dõi lượt xem khi thẻ được click
    if (hotel?.id) {
      await viewTrackingService.trackView(hotel.id);
    }
    
    // Gọi hàm onClick ban đầu
    onClick?.(hotel);
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        onMouseEnter={() => setHoveredHotelId(hotel?.id ?? null)}
        onMouseLeave={() => setHoveredHotelId(null)}
        className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-card hover:-translate-y-1 hover:shadow-editorial transition-all duration-200"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
        aria-label={`Xem ${hotel?.name || "khách sạn"}`}
      >
        <div className={`relative ${compact ? 'h-40' : 'h-52'} overflow-hidden`}>
          {imageLoading && (
            <div className="absolute inset-0 bg-surface-container animate-pulse" />
          )}
          <img
            src={displayUrl}
            alt={hotel?.name || "Hình ảnh khách sạn"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Đánh dấu URL này thất bại để tránh vòng retry và dùng placeholder ổn định
              try { markFailedUrl(imageUrl); } catch (err) { /* ignore */ }
              e.target.src = googlePlaceholder;
            }}
          />

          {/* Hộp đánh giá người dùng - góc trên trái */}
          {reviews && reviews.length > 0 && (
            <div className="review-box">
              <div className="review-rating">
                ⭐ {reviews[0].rawRating || reviews[0].rawStars || reviews[0].raw_rating || reviews[0].raw_star || 0}
              </div>
              <div className="review-text">
                "{reviews[0].text}"
              </div>
            </div>
          )}

          {/* Nút lưu vào danh sách - góc trên trái (dưới đánh giá nếu có) */}
          <div className={`absolute ${reviews && reviews.length > 0 ? 'top-24' : 'top-3'} left-3`}>
            <button
              onClick={handleSaveClick}
              className="glass p-2 rounded-full hover:bg-white/90 transition-all shadow-sm group/save"
              title="Lưu vào danh sách"
            >
              <Icon 
                name="bookmark_border" 
                size={18} 
                className={`${accent === 'green' ? 'text-emerald-300' : 'text-primary'} group-hover/save:scale-110 transition-transform`} 
              />
            </button>
          </div>

          {/* Biểu tượng đánh giá - góc trên phải */}
          <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Icon name="star" filled size={14} className="text-amber-500" />
            <span className={`text-sm font-bold ${accent === 'green' ? 'text-emerald-300' : 'text-primary'}`}>
              {hotel?.rawRating ? Number(hotel.rawRating).toFixed(1) : "-"}
            </span>
          </div>

          {/* Biểu tượng điểm AI */}
          {hotel?.ai_score && hotel.ai_score > 0 && (
            <div className="absolute top-12 right-3 bg-blue-600/90 text-white px-2.5 py-1 rounded-full">
              <span className="text-xs font-bold">AI: {Number(hotel.ai_score).toFixed(1)}</span>
            </div>
          )}

          {/* Badges khách sạn - góc dưới phải để tránh chồng */}
          {hotel?.badge && (
            <div className="absolute bottom-3 right-3">
              <span className={`${accent === 'green' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'} text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full`}>
                {hotel.badge}
              </span>
            </div>
          )}

          {/* Nút thêm vào yêu thích - góc dưới trái */}
          <div className="absolute bottom-3 left-3 flex items-center">
            <div className="glass p-2 flex justify-center items-center rounded-full hover:bg-white/90 transition-all shadow-sm">
              <AddToFavoritesButton
                hotelId={hotel?.id}
                hotelData={hotel}
                size={20}
                initialFavorited={!!hotel?.isFavorited}
                skipInitialCheck={true}
              />
            </div>
          </div>
        </div>

        <div className={`${compact ? 'p-3' : 'p-4'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className={`font-headline font-bold ${compact ? 'text-sm' : 'text-lg'} ${accent === 'green' ? 'text-emerald-300' : 'text-primary'} leading-tight truncate`}>{hotel?.name}</h3>
              
              {/* Hiển thị khoảng cách với icon điều hướng (đã bỏ địa chỉ) */}
              {hotel?.distance !== undefined && hotel?.distance !== null && (
                <p className="text-xs text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                  <Icon name="navigation" size={14} className="flex-none" />
                  {hotel.distance.toFixed(1)} km
                </p>
              )}
            </div>

            <div className="text-right flex-none">
              <p className={`${compact ? 'text-sm' : 'text-base'} font-extrabold ${accent === 'green' ? 'text-emerald-300' : 'text-primary'} font-headline`}>{fmtPriceExact(hotel?.pricePerNight ?? 0)}</p>
              <p className="text-[10px] text-outline uppercase font-semibold">mỗi đêm</p>
            </div>
          </div>

          {/* Hiển thị lượt xem và đánh giá */}
          <div className="flex items-center gap-3 mt-2">
            {/* Hiển thị điểm đánh giá thô */}
            <div className="flex items-center gap-1 text-on-surface-variant">
              <Icon name="star" filled size={14} className="text-amber-500" />
              <span className="text-xs font-medium">
                {hotel?.rawRating ? Number(hotel.rawRating).toFixed(1) : hotel?.rating ? Number(hotel.rating).toFixed(1) : "-"}
              </span>
            </div>
            
            {/* Số lượt xem nằm bên phải điểm đánh giá */}
            {hotel?.totalViews !== undefined && hotel?.totalViews > 0 && (
              <div className="flex items-center gap-1 text-on-surface-variant">
                <Icon name="visibility" size={14} />
                <span className="text-xs font-medium">
                  {formatViewCount(hotel.totalViews)}
                </span>
              </div>
            )}
          </div>

          <div className={`flex gap-4 ${compact ? 'mt-2' : 'mt-3'}`}>
            {amenityIcons.map((a) => (
              <div key={`${a.icon}-${a.label}`} className="flex items-center gap-1 text-on-surface-variant">
                <Icon name={a.icon} size={16} className="text-tertiary-container" />
                <span className="text-xs font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Modal lưu vào bộ sưu tập (kích thước lớn, hiển thị bộ sưu tập đã lưu) */}
      <SaveToCollectionModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        hotel={hotel}
      />
    </>
  );
}

export default HotelCard;

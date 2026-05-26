import { fmtPriceExact } from "@/utils/format";
import Icon from "@/components/ui/Icon";
import { useApp } from "@/app/AppContext";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import SaveToCollectionModal from "@/components/profile/SaveToCollectionModal";
import AddToFavoritesButton from "@/components/hotel/AddToFavoritesButton";
import { getImageWithFallback } from "@/utils/imageUtils";
import { useImageCache, markFailedUrl } from "@/hooks/useImageCache";
import viewTrackingService from "@/services/viewTracking.service";

function IntroHotelCard({ hotel, onClick, compact = false, accent }) {
  const { setHoveredHotelId } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);

  const firstImage = hotel?.images?.[0];
  const imageUrl = getImageWithFallback(firstImage);
  const { cachedUrl, isLoading: imageLoading } = useImageCache(imageUrl);
  const googlePlaceholder = "https://storage.googleapis.com/support-forums-api/attachment/thread-62654029-5647160710799411463.png";
  const displayUrl = cachedUrl || imageUrl || googlePlaceholder;

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    setShowSaveModal(true);
  };

  const handleCardClick = async () => {
    if (hotel?.id) await viewTrackingService.trackView(hotel.id);
    onClick?.(hotel);
  };

  return (
    <article
      onClick={handleCardClick}
      onMouseEnter={() => setHoveredHotelId(hotel?.id ?? null)}
      onMouseLeave={() => setHoveredHotelId(null)}
      className={`group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-card hover:-translate-y-1 transition-all duration-200`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      aria-label={`View ${hotel?.name || 'hotel'}`}
    >
      <div className={`relative ${compact ? 'h-28' : 'h-32'} overflow-hidden`}>
        {imageLoading && <div className="absolute inset-0 bg-surface-container animate-pulse" />}
        <img src={displayUrl} alt={hotel?.name || 'Hotel image'} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" onError={(e) => { try { markFailedUrl(imageUrl); } catch(_){} e.target.src = googlePlaceholder; }} />

        {/* Badge - Bottom Right */}
        {hotel?.badge && (
          <div className="absolute bottom-3 right-3">
            <span className={`${accent === 'green' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'} text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full`}>{hotel.badge}</span>
          </div>
        )}

        {/* Save to Collection Button - Top Left */}
        <div className="absolute top-3 left-3 flex items-center">
          <button onMouseDown={(e) => e.stopPropagation()} onClick={handleSaveClick} className="glass p-2 rounded-full hover:bg-white/90 transition-all shadow-sm group/save" title="Lưu vào danh sách">
            <Icon name="bookmark_border" size={18} className={`${accent === 'green' ? 'text-emerald-300' : 'text-primary'} group-hover/save:scale-110 transition-transform`} />
          </button>
        </div>

        {/* Add to Favorites Button - Top Right */}
        <div className="absolute top-3 right-3 flex items-center">
          <div className="glass p-2 flex justify-center items-center rounded-full hover:bg-white/90 transition-all shadow-sm">
            <AddToFavoritesButton
              hotelId={hotel?.id}
              hotelData={hotel}
              size={18}
              initialFavorited={!!hotel?.isFavorited}
              skipInitialCheck={true}
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#030a08]">
        <div className="flex flex-col gap-2">
          <div>
            <h3 className={`font-headline font-bold ${compact ? 'text-sm' : 'text-lg'} ${accent === 'green' ? 'text-emerald-300' : 'text-primary'} leading-tight truncate`}>{hotel?.name}</h3>
          </div>

          <div className="flex flex-col gap-1">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Icon name="star" filled size={14} className="text-amber-500" />
              <span className={`text-xs font-medium ${accent === 'green' ? 'text-emerald-300' : 'text-primary'}`}>
                  {hotel?.rawRating ? Number(hotel.rawRating).toFixed(1) : hotel?.rating ? Number(hotel.rating).toFixed(1) : "-"}
              </span>
            </div>
            
            {/* Price */}
            <p className={`${compact ? 'text-sm' : 'text-base'} font-extrabold ${accent === 'green' ? 'text-emerald-300' : 'text-primary'} font-headline`}>{fmtPriceExact(hotel?.pricePerNight ?? 0)}</p>
            
            {/* Distance if available */}
            {hotel?.distance !== undefined && hotel?.distance !== null && (
              <p className="text-xs text-on-surface-variant flex items-center gap-0.5"><Icon name="navigation" size={14} className="flex-none" />{hotel.distance.toFixed(1)} km</p>
            )}
          </div>
        </div>
      </div>

      {showSaveModal && createPortal(
        <SaveToCollectionModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} hotel={hotel} />,
        document.body
      )}
    </article>
  );
}

export default IntroHotelCard;

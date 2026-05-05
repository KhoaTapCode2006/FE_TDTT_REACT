import { fmtPrice } from "@/utils/format";
import { AMENITY_META } from "@/constants/enums";
import Icon from "@/components/ui/Icon";
import { useApp } from "@/app/AppContext";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SaveToListModal from "@/components/profile/SaveToListModal";
import AddToFavoritesButton from "@/components/hotel/AddToFavoritesButton";

function HotelCard({ hotel, onClick }) {
  const { setHoveredHotelId } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const imageSrc = hotel?.images?.[0] || "https://via.placeholder.com/640x480?text=No+Image";
  const amenityIcons = (hotel?.amenities || []).slice(0, 3).map((a) => {
    const meta = AMENITY_META[a];
    return meta ? meta : { icon: "check", label: String(a) };
  });

  const handleSaveClick = (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/auth/login');
      return;
    }
    
    setShowSaveModal(true);
  };

  return (
    <>
      <article
        onClick={() => onClick?.(hotel)}
        onMouseEnter={() => setHoveredHotelId(hotel?.id ?? null)}
        onMouseLeave={() => setHoveredHotelId(null)}
        className="group cursor-pointer rounded-2xl overflow-hidden bg-white shadow-card hover:-translate-y-1 hover:shadow-editorial transition-all duration-200"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick?.(hotel)}
        aria-label={`View ${hotel?.name || "hotel"}`}
      >
        <div className="relative h-52 overflow-hidden">
          <img
            src={imageSrc}
            alt={hotel?.name || "Hotel image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Save to List Button - Top Left */}
          <div className="absolute top-3 left-3">
            <button
              onClick={handleSaveClick}
              className="glass p-2 rounded-full hover:bg-white/90 transition-all shadow-sm group/save"
              title="Lưu vào danh sách"
            >
              <Icon 
                name="bookmark_border" 
                size={18} 
                className="text-primary group-hover/save:scale-110 transition-transform" 
              />
            </button>
          </div>

          {/* Rating Badge - Top Right */}
          <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Icon name="star" filled size={14} className="text-amber-500" />
            <span className="text-sm font-bold text-primary">{hotel?.rating ?? "-"}</span>
          </div>

          {/* AI Score Badge */}
          {hotel?.ai_score && (
            <div className="absolute top-12 right-3 bg-blue-600/90 text-white px-2.5 py-1 rounded-full">
              <span className="text-xs font-bold">AI: {Number(hotel.ai_score).toFixed(1)}</span>
            </div>
          )}

          {/* Hotel Badge - Move to bottom right to avoid overlap */}
          {hotel?.badge && (
            <div className="absolute bottom-3 right-3">
              <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {hotel.badge}
              </span>
            </div>
          )}

          {/* Add to Favorites Button - Bottom Left */}
          <div className="absolute bottom-3 left-3">
            <div className="glass p-2 rounded-full hover:bg-white/90 transition-all shadow-sm">
              <AddToFavoritesButton
                hotelId={hotel?.id}
                hotelData={hotel}
                size={20}
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-headline font-bold text-lg text-primary leading-tight truncate">{hotel?.name}</h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                <Icon name="location_on" size={14} className="flex-none" />
                {hotel?.address}
              </p>
            </div>

            <div className="text-right flex-none">
              <p className="text-base font-extrabold text-primary font-headline">{fmtPrice(hotel?.pricePerNight ?? 0)}</p>
              <p className="text-[10px] text-outline uppercase font-semibold">per night</p>
            </div>
          </div>

          <div className="flex gap-4 mt-3">
            {amenityIcons.map((a) => (
              <div key={`${a.icon}-${a.label}`} className="flex items-center gap-1 text-on-surface-variant">
                <Icon name={a.icon} size={16} className="text-tertiary-container" />
                <span className="text-xs font-medium">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Save to List Modal */}
      <SaveToListModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        hotel={hotel}
      />
    </>
  );
}

export default HotelCard;

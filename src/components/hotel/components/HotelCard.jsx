import { fmtPrice, formatViewCount } from "@/utils/format";
import { AMENITY_META } from "@/constants/enums";
import Icon from "@/components/ui/Icon";
import { useApp } from "@/app/AppContext";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SaveToListModal from "@/components/profile/SaveToListModal";
import AddToFavoritesButton from "@/components/hotel/AddToFavoritesButton";
import { getImageWithFallback } from "@/utils/imageUtils";
import { useImageCache } from "@/hooks/useImageCache";
import viewTrackingService from "@/services/viewTracking.service";

function HotelCard({ hotel, onClick }) {
  const { setHoveredHotelId } = useApp();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const reviews = hotel?.userReviews || hotel?.reviews || hotel?.user_reviews || [];
  
  // Handle image objects with thumbnail and original using utility functions
  const firstImage = hotel?.images?.[0];
  const imageUrl = getImageWithFallback(firstImage);
  const { cachedUrl, isLoading: imageLoading, error: imageError } = useImageCache(imageUrl);
  
  // Use Google's placeholder image instead of via.placeholder (which doesn't work)
  const googlePlaceholder = "https://lh3.googleusercontent.com/p/AF1QipNKKx5nFjXqKvLBqJvLqKvLBqJvLqKvLBqJvLqK=s1600-w400";
  const displayUrl = imageError 
    ? googlePlaceholder
    : cachedUrl || imageUrl || googlePlaceholder;
  
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

  const handleCardClick = async () => {
    // Track view when card is clicked
    if (hotel?.id) {
      await viewTrackingService.trackView(hotel.id);
    }
    
    // Call the original onClick handler
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
        aria-label={`View ${hotel?.name || "hotel"}`}
      >
        <div className="relative h-52 overflow-hidden">
          {imageLoading && (
            <div className="absolute inset-0 bg-surface-container animate-pulse" />
          )}
          <img
            src={displayUrl}
            alt={hotel?.name || "Hotel image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Use Google's placeholder instead of via.placeholder
              e.target.src = "https://lh3.googleusercontent.com/p/AF1QipNKKx5nFjXqKvLBqJvLqKvLBqJvLqKvLBqJvLqK=s1600-w400";
            }}
          />

          {/* User Review Box - Top Left */}
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

          {/* Save to List Button - Top Left (below review if present) */}
          <div className={`absolute ${reviews && reviews.length > 0 ? 'top-24' : 'top-3'} left-3`}>
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
            <span className="text-sm font-bold text-primary">
              {hotel?.rating ? Number(hotel.rating).toFixed(1) : hotel?.rawRating ? Number(hotel.rawRating).toFixed(1) : "-"}
            </span>
          </div>

          {/* AI Score Badge */}
          {hotel?.ai_score && hotel.ai_score > 0 && (
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
          <div className="absolute bottom-3 left-3 flex items-center">
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
            <div className="min-w-0 flex-1">
              <h3 className="font-headline font-bold text-lg text-primary leading-tight truncate">{hotel?.name}</h3>
              
              {/* Distance display with navigation icon (removed address) */}
              {hotel?.distance !== undefined && hotel?.distance !== null && (
                <p className="text-xs text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                  <Icon name="navigation" size={14} className="flex-none" />
                  {hotel.distance.toFixed(1)} km
                </p>
              )}
            </div>

            <div className="text-right flex-none">
              <p className="text-base font-extrabold text-primary font-headline">{fmtPrice(hotel?.pricePerNight ?? 0)}</p>
              <p className="text-[10px] text-outline uppercase font-semibold">per night</p>
            </div>
          </div>

          {/* View count and rating display */}
          <div className="flex items-center gap-3 mt-2">
            {/* Raw rating display */}
            <div className="flex items-center gap-1 text-on-surface-variant">
              <Icon name="star" filled size={14} className="text-amber-500" />
              <span className="text-xs font-medium">
                {hotel?.rawRating ? Number(hotel.rawRating).toFixed(1) : hotel?.rating ? Number(hotel.rating).toFixed(1) : "-"}
              </span>
            </div>
            
            {/* View count to the right of rating */}
            {hotel?.totalViews !== undefined && hotel?.totalViews > 0 && (
              <div className="flex items-center gap-1 text-on-surface-variant">
                <Icon name="visibility" size={14} />
                <span className="text-xs font-medium">
                  {formatViewCount(hotel.totalViews)}
                </span>
              </div>
            )}
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

import { fmtPrice } from "@/utils/format";
import { AMENITY_META } from "@/constants/enums";
import Icon from "@/components/ui/Icon";
import { useApp } from "@/app/AppContext";

function HotelCard({ hotel, onClick }) {
  const { setHoveredHotelId } = useApp();
  const imageSrc = hotel?.images?.[0] || "https://via.placeholder.com/640x480?text=No+Image";
  const amenityIcons = (hotel?.amenities || []).slice(0, 3).map((a) => {
    const meta = AMENITY_META[a];
    return meta ? meta : { icon: "check", label: String(a) };
  });

  return (
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

        <div className="absolute top-3 right-3 glass px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Icon name="star" filled size={14} className="text-amber-500" />
          <span className="text-sm font-bold text-primary">{hotel?.rating ?? "-"}</span>
        </div>

        {hotel?.ai_score && (
          <div className="absolute top-3 left-3 bg-blue-600/90 text-white px-2.5 py-1 rounded-full">
            <span className="text-xs font-bold">AI: {Number(hotel.ai_score).toFixed(1)}</span>
          </div>
        )}

        {hotel?.badge && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {hotel.badge}
            </span>
          </div>
        )}
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
  );
}

export default HotelCard;

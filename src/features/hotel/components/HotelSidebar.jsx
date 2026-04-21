import { useEffect, useState } from "react";
import { useApp } from "@/app/AppContext";
import HotelCard from "./HotelCard";
import Icon from "@/components/ui/Icon";

function HotelSidebar({ onFilterOpen }) {
  const { hotels, loading, setActiveHotel, clusterHotels, activeHotel } = useApp();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [hotels]);

  const total = hotels.length;
  const current = hotels[idx] || null;
  const isFirst = idx === 0;
  const isLast = idx === total - 1;
  const hasCluster = clusterHotels && clusterHotels.length > 0;

  return (
    <aside className="w-full md:w-[420px] lg:w-[460px] bg-surface-container-lowest border-l border-outline-variant/20 flex flex-col overflow-hidden">
      <div className="bg-surface-container-lowest/95 backdrop-blur-sm z-10 px-6 pt-6 pb-4 border-b border-outline-variant/10 flex-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Curated Stays</h2>
            <p className="text-on-surface-variant text-xs mt-0.5">Exclusively for Booking4LU members</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">
              {loading ? "…" : total === 0 ? "0 Results" : `${idx + 1} / ${total} Results`}
            </span>
            <button
              type="button"
              onClick={onFilterOpen}
              className="flex items-center gap-1.5 bg-secondary-container text-on-secondary-container px-3 py-2 rounded-xl font-bold text-xs hover:brightness-95 transition-all active:scale-95"
            >
              <Icon name="tune" size={18} />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 pt-6 pb-6">
        {loading ? (
          <div className="h-full w-full rounded-[32px] bg-surface-container-highest animate-pulse" />
        ) : total === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Icon name="search_off" size={48} className="text-outline" />
            <p className="font-headline font-bold text-lg text-primary">No stays found</p>
            <p className="text-sm text-on-surface-variant">Try adjusting your filters or expanding the radius.</p>
          </div>
        ) : hasCluster ? (
          <div className="h-full overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-headline text-lg font-bold text-primary mb-2">Hotels in this cluster</h3>
              <p className="text-xs text-on-surface-variant">{clusterHotels.length} hotels at this location</p>
            </div>
            <div className="space-y-2">
              {clusterHotels.map((hotel) => (
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
                    {hotel.images && hotel.images[0] && (
                      <img
                        src={hotel.images[0]}
                        alt={hotel.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
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
              ))}
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={isFirst}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card border border-outline-variant/30 text-primary hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="chevron_left" size={24} />
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                disabled={isLast}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card border border-outline-variant/30 text-primary hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Icon name="chevron_right" size={24} />
              </button>
            </div>

            <div className="h-full pt-14 pb-20 overflow-y-auto pr-1">
              <HotelCard hotel={current} onClick={setActiveHotel} />
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2">
              {hotels.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`rounded-full transition-all ${i === idx ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-outline-variant hover:bg-primary/40"}`}
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

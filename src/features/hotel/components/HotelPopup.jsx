import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/app/AppContext";
import { fmtPrice } from "@/utils/format";
import { AMENITY_META } from "@/constants/enums";
import Icon from "@/components/ui/Icon";

function HotelPopup({ hotel, onClose }) {
  const { dates } = useApp();
  const { checkIn, checkOut } = dates;
  const [slide, setSlide] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [imgScale, setImgScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, panX: 0, panY: 0 });

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    return Math.max(1, Math.round((checkOut - checkIn) / 86400000));
  }, [checkIn, checkOut]);

  const total = useMemo(() => {
    return hotel ? hotel.pricePerNight * nights : 0;
  }, [hotel, nights]);

  useEffect(() => {
    if (imgScale <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [imgScale]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        if (zoomed) {
          setZoomed(false);
          setImgScale(1);
        } else {
          onClose?.();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, zoomed]);

  if (!hotel) {
    return null;
  }

  const images = hotel.images?.length ? hotel.images : ["https://via.placeholder.com/800x600?text=No+Image"];

  function handleMouseDown(event) {
    if (imgScale <= 1) return;
    event.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function handleMouseMove(event) {
    if (!dragRef.current.dragging) return;
    setPan({
      x: dragRef.current.panX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (event.clientY - dragRef.current.startY),
    });
  }

  function handleMouseUp() {
    dragRef.current.dragging = false;
  }

  function goPrev() {
    setSlide((current) => (current - 1 + images.length) % images.length);
    setImgScale(1);
  }

  function goNext() {
    setSlide((current) => (current + 1) % images.length);
    setImgScale(1);
  }

  const visibleAmenities = (hotel.amenities || []).slice(0, 6);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row md:h-[85vh]">
        <div className="relative h-80 md:h-auto md:w-1/2 overflow-hidden bg-surface-container-highest">
          <div
            className="h-full w-full cursor-pointer"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={images[slide]}
              alt={`${hotel.name} ${slide + 1}`}
              draggable={false}
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${imgScale}) translate(${pan.x / imgScale}px, ${pan.y / imgScale}px)`,
                transition: dragRef.current.dragging ? "none" : "transform 0.2s ease",
                transformOrigin: "center center",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (zoomed) {
                setZoomed(false);
                setImgScale(1);
              } else {
                setZoomed(true);
                setImgScale(2);
              }
            }}
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white"
          >
            <Icon name={zoomed ? "zoom_out" : "zoom_in"} size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white"
              >
                <Icon name="chevron_left" size={24} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white"
              >
                <Icon name="chevron_right" size={24} />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <button
            type="button"
            onClick={onClose}
            className="ml-auto mb-4 rounded-full bg-surface-container-low px-3 py-2 text-on-surface hover:bg-surface-container transition"
          >
            <Icon name="close" size={20} />
          </button>

          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-primary">{hotel.name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant">
                <Icon name="location_on" size={16} className="text-primary" />
                {hotel.address}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Stay details</p>
                <p className="mt-3 text-lg font-semibold text-primary">{nights} night{nights > 1 ? "s" : ""}</p>
                <p className="text-sm text-on-surface-variant">{fmtPrice(hotel.pricePerNight)} per night</p>
              </div>
              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Total price</p>
                <p className="mt-3 text-3xl font-headline font-extrabold text-primary">{fmtPrice(total)}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-surface-container-low p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Amenities</p>
                <span className="text-xs font-semibold text-secondary">{hotel.amenities?.length || 0} items</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {visibleAmenities.map((amenity) => {
                  const meta = AMENITY_META[amenity] || { icon: "check", label: amenity };
                  return (
                    <div key={amenity} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm">
                      <Icon name={meta.icon} size={18} className="text-primary" />
                      <span className="text-sm font-medium text-primary">{meta.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 flex-col sm:flex-row">
              <button
                type="button"
                onClick={() => alert(`Booking flow for ${hotel.name}`)}
                className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-container"
              >
                Book Now
              </button>
              <button
                type="button"
                onClick={() => window.open(hotel.link || "#", "_blank")}
                className="w-full rounded-2xl border border-primary px-6 py-3 text-sm font-bold text-primary transition hover:bg-surface-container"
              >
                Visit Hotel Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HotelPopup;

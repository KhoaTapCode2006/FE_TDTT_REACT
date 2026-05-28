import { useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import vietnamMap from '@/constants/vietnamMap.png';
export const CITY_MARKERS = [
  { name: 'Hà Nội', address: 'Thành Phố Hà Nội', top: '25.5%', left: '51%' },
  { name: 'Huế', address: 'Thành Phố Huế', top: '48%', left: '57%' },
  { name: 'Quy Nhơn', address: 'Thành Phố Quy Nhơn', top: '65%', left: '68%' },
  { name: 'Đà Lạt', address: 'Thành Phố Đà Lạt, Tỉnh Lâm Đồng', top: '74%', left: '64%' },
  { name: 'TP. Hồ Chí Minh', address: 'Thành phố Hồ Chí Minh', top: '81%', left: '56%' },
];

function IntroMapSection({
  hoveredCityId = null,
  loadingCityId = null,
  statusMessage = '',
  onMarkerHover,
  onMarkerLeave,
  onMarkerClick,
}) {
  const markerElements = useMemo(
    () => CITY_MARKERS.map((city) => ({
      ...city,
      id: city.name,
    })),
    []
  );

  return (
    <div className="relative rounded-4xl" style={{
      zIndex: 40,
      height: 950,
      maskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 0%, black 70%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 50% 50%, black 0%, black 70%, transparent 100%)',
      overflow: 'hidden'
    }}>
      <img
        src={vietnamMap}
        alt="Vietnam map"
        className="object-cover"
        style={{
          height: '100%',
          width: '130%',
          marginLeft: '10%',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
      />

      {markerElements.map((marker) => {
        const isActive = hoveredCityId === marker.id;
        const isLoading = loadingCityId === marker.id;

        return (
          <button
            key={marker.id}
            type="button"
            onClick={() => onMarkerClick?.(marker)}
            onMouseEnter={() => onMarkerHover?.(marker.id)}
            onMouseLeave={() => onMarkerLeave?.()}
            className="absolute flex flex-col items-center gap-2 rounded-full transition-all duration-300 ease-out"
            style={{
              top: marker.top,
              left: marker.left,
              transform: 'translate(-50%, -50%)',
              zIndex: 3000,
              minWidth: 0,
              pointerEvents: 'auto'
            }}
          >
            <span className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive ? 'scale-110 bg-emerald-400/20 shadow-[0_0_30px_rgba(16,185,76,0.45)]' : 'bg-transparent'}`} />
            <span className={`relative z-50 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/30 bg-slate-950/80 text-emerald-300 transition-all duration-300 ${isActive ? 'scale-110 border-emerald-300 bg-emerald-400/20 shadow-[0_0_30px_rgba(16,185,76,0.45)]' : 'hover:border-emerald-400/50 hover:bg-emerald-400/10'}`}>
              {isLoading ? (
                <span className="h-5 w-5 rounded-full border-2 border-emerald-300 border-t-transparent animate-spin" />
              ) : (
                <Icon name="location_on" size={22} />
              )}
            </span>
            <span className="relative z-50 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100 shadow-sm">
              {marker.name}
            </span>
          </button>
        );
      })}

      {statusMessage && (
        <div className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-slate-950/95 px-4 py-2 text-sm font-medium text-slate-100 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm">
          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default IntroMapSection;

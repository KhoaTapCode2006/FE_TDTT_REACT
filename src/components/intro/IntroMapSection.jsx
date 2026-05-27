import Icon from '@/components/ui/Icon';
import vietnamMap from '../../../vietnamMap.png';

function IntroMapSection() {
  return (
    <div className="relative overflow-visible rounded-4xl" style={{ height: 720 }}>
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

      {/* Suggestion panel removed for Intro per request */}

      <div className="absolute top-[18%] left-[36%] flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,76,0.4)]">
          <Icon name="location_on" size={20} />
        </div>
        <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100">Hà Nội</span>
      </div>

      <div className="absolute top-[44%] left-[52%] flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,76,0.4)]">
          <Icon name="location_on" size={20} />
        </div>
        <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100">Đà Nẵng</span>
      </div>

      <div className="absolute top-[55%] left-[58%] flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,76,0.4)]">
          <Icon name="location_on" size={20} />
        </div>
        <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100">Nha Trang</span>
      </div>

      <div className="absolute top-[66%] left-[48%] flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,76,0.4)]">
          <Icon name="location_on" size={20} />
        </div>
        <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100">Đà Lạt</span>
      </div>

      <div className="absolute top-[78%] left-[34%] flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,76,0.4)]">
          <Icon name="location_on" size={20} />
        </div>
        <span className="rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100">TP. Hồ Chí Minh</span>
      </div>

      <div className="absolute bottom-8 right-14 flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-200 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)]">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
        Hoàng Sa
      </div>
      <div className="absolute bottom-6 right-5 flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-200 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.8)]">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
        Trường Sa
      </div>
    </div>
  );
}

export default IntroMapSection;

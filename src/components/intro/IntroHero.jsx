import SearchBarIntro from '@/components/intro/SearchBarIntro';
import IntroMapSection from '@/components/intro/IntroMapSection';
import IntroTopHotelsSection from '@/components/intro/IntroTopHotelsSection';

const SUGGESTIONS = ['Đà Lạt', 'Nha Trang', 'Đà Nẵng', 'Phú Quốc', 'Hà Nội', 'TP. Hồ Chí Minh'];

function IntroHero() {
  return (
    <section
      className="relative bg-[#071511] px-2 py-14 sm:px-2 lg:px-2"
      style={{
        overflow: 'visible',
        backgroundImage:
          'radial-gradient(circle at top left, rgba(16,185,76,0.22), transparent 35%), radial-gradient(circle at top right, rgba(74,222,128,0.18), transparent 30%)',
      }}
    >
      <div className="relative mx-auto max-w-screen-2xl overflow-visible">
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr_300px] lg:items-start overflow-visible">
          <div className="space-y-8 pt-4 relative z-30">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 backdrop-blur-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">AI</span>
              AI-Powered Hotel Search
            </div>
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Tìm khách sạn <span className="text-emerald-300">lý tưởng</span>,<br />
                theo cách <span className="text-emerald-400">của bạn</span>
              </h1>
              <p className="text-base leading-8 text-slate-300 sm:text-lg">
                Lodgy4U sử dụng AI để hiểu nhu cầu của bạn và gợi ý những khách sạn phù hợp nhất về vị trí, tiện nghi và ngân sách.
              </p>
            </div>

            <div className="relative z-50" style={{ marginRight: '-160px', width: 'calc(100% + 160px)' }}>
              <SearchBarIntro />
            </div>

            <div className="mt-6">
              <div className="rounded-4xl flex flex-wrap border border-emerald-500/20 bg-slate-950/95 p-4 shadow-[0_40px_120px_-80px_rgba(16,185,76,0.9)] max-w-3xl">
                <div className="flex flex-wrap gap-3">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-emerald-600/30 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-400 hover:bg-emerald-400/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <IntroMapSection />
          </div>

          <div className="relative z-20" style={{ marginRight: '-40px' }}>
            <IntroTopHotelsSection />
          </div>
        </div>
      </div>
    </section>
  );
}

export default IntroHero;

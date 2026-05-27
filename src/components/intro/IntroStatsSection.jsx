const STATS = [
  { value: '10K+', label: 'Người dùng tin tưởng' },
  { value: '500+', label: 'Điểm đến' },
  { value: '20K+', label: 'Khách sạn toàn quốc' },
  { value: '100%', label: 'Thông tin xác thực' },
];

function IntroStatsSection() {
  return (
    <section className="mt-16 px-2 sm:px-0">
      <div className="mx-auto max-w-screen-2xl rounded-4xl border border-emerald-500/20 bg-slate-950/90 p-8 shadow-[0_40px_120px_-90px_rgba(16,185,76,0.9)]">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-emerald-500/10 bg-slate-900/90 p-6 text-center">
              <div className="text-4xl font-extrabold text-emerald-300">{stat.value}</div>
              <div className="mt-3 text-sm text-slate-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default IntroStatsSection;

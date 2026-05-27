import Icon from '@/components/ui/Icon';

const FEATURES = [
  {
    title: 'Tìm kiếm thông minh',
    description: 'AI hiểu nhu cầu của bạn và tìm ra khách sạn phù hợp nhất.',
    icon: 'search',
  },
  {
    title: 'Bộ sưu tập cá nhân',
    description: 'Lưu, sắp xếp và chia sẻ khách sạn bạn yêu thích.',
    icon: 'bookmark',
  },
  {
    title: 'Trò chuyện AI',
    description: 'Hỏi đáp nhanh mọi thắc mắc về khách sạn và điểm đến.',
    icon: 'chat',
  },
  {
    title: 'Ưu đãi độc quyền',
    description: 'Cập nhật các deal tốt nhất mỗi ngày dành riêng cho bạn.',
    icon: 'local_offer',
  },
];

function IntroFeaturesSection() {
  return (
    <section className="mt-16 px-2 pb-2 sm:px-0">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Tính năng nổi bật</p>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Trải nghiệm tìm khách sạn mới mẻ và thân thiện</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[28px] border border-emerald-500/20 bg-slate-950/90 p-6 shadow-[0_24px_80px_-50px_rgba(16,185,76,0.7)]"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <Icon name={feature.icon} size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default IntroFeaturesSection;

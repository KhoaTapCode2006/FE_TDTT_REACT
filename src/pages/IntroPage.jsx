import IntroHero from '@/components/intro/IntroHero';
import IntroFeaturesSection from '@/components/intro/IntroFeaturesSection';
import IntroStatsSection from '@/components/intro/IntroStatsSection';

function IntroPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <IntroHero />

      <main className="mx-auto max-w-screen-2xl px-4 pb-20 sm:px-6 lg:px-8">
        <IntroFeaturesSection />
        <IntroStatsSection />
      </main>
    </div>
  );
}

export default IntroPage;

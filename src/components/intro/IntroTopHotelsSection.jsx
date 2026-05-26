import HotelListSection from '@/components/hotel/components/HotelListSection';
import Icon from '@/components/ui/Icon';
import { FaRegStar } from "react-icons/fa";
function IntroTopHotelsSection() {
  return (
    <section className="mt-2 rounded-4xl border border-emerald-500/20 bg-slate-950/80  shadow-[0_40px_120px_-90px_rgba(16,185,76,0.9)]">
      <div className="py-4 ml-4 text-2xl font-bold flex items-center gap-2"> 
  <FaRegStar className="text-emerald-400" /> 
  <span>Gợi ý cho bạn</span>
</div>
      <HotelListSection
        weeklyLimit={3}
        showAllTime={false}
        weeklyTitle="Top view tuần này"
        weeklySubtitle="Những khách sạn được quan tâm nhiều nhất trong tuần"
        itemsPerPageLg={3}
        accent="green"
        hideHeader={true}
        vertical={true}
      />
    </section>
  );
}

export default IntroTopHotelsSection;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/app/AppContext';
import { hotelSearchService } from '@/services/backend/hotelSearch.service';
import SearchBarIntro from '@/components/intro/SearchBarIntro';
import IntroMapSection, { CITY_MARKERS } from '@/components/intro/IntroMapSection';
import IntroTopHotelsSection from '@/components/intro/IntroTopHotelsSection';

const SUGGESTIONS = ['Đà Lạt', 'Huế', 'Quy Nhơn', 'Hà Nội', 'TP. Hồ Chí Minh'];

function getDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const format = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    check_in: format(today),
    check_out: format(tomorrow),
  };
}

function IntroHero() {
  const navigate = useNavigate();
  const { setHotels, setActiveHotel, setSearchGps } = useApp();
  const [hoveredCity, setHoveredCity] = useState(null);
  const [loadingCity, setLoadingCity] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleCitySearch = async (city) => {
    const cityName = city?.name || 'địa điểm';
    setHoveredCity(city?.name || null);
    setLoadingCity(city?.name || null);
    setStatusMessage(`Đang tìm khách sạn ở ${cityName}...`);
    setActiveHotel(null);

    try {
      const defaultDates = getDefaultDates();
      const response = await hotelSearchService.searchHotels({
        address: city?.address || `${cityName}, Việt Nam`,
        gps: { latitude: 0, longitude: 0, geohash: '' },
        ref_id: '',
        check_in: defaultDates.check_in,
        check_out: defaultDates.check_out,
        children: [],
        adults: 2,
        personality: ''
      });

      const results = response?.hotels || [];
      setHotels(results);

      const searchingPlace = response?.searchingPlace || null;
      if (searchingPlace && searchingPlace.gps && setSearchGps) {
        setSearchGps({
          latitude: searchingPlace.gps.latitude,
          longitude: searchingPlace.gps.longitude
        });
      }

      setStatusMessage(results.length > 0 ? `Đã tìm thấy ${results.length} khách sạn tại ${cityName}` : `Không tìm thấy khách sạn tại ${cityName}`);
      navigate('/');
    } catch (error) {
      console.error('Search failed:', error);
      setStatusMessage(`Không thể tìm khách sạn tại ${cityName}. Vui lòng thử lại.`);
    } finally {
      setLoadingCity(null);
      window.setTimeout(() => setStatusMessage(''), 4500);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const matchedCity = CITY_MARKERS.find((city) => city.name === suggestion);
    handleCitySearch(matchedCity ?? { name: suggestion, address: `${suggestion}, Việt Nam` });
  };

  const handleSuggestionHover = (suggestion) => {
    const matchedCity = CITY_MARKERS.find((city) => city.name === suggestion);
    setHoveredCity(matchedCity?.name ?? null);
  };

  const handleSuggestionLeave = () => {
    setHoveredCity(null);
  };

  return (
    <section
      className="relative bg-[#071511] px-2 py-14 sm:px-2 lg:px-2 min-h-[950px]"
      style={{
        overflow: 'visible',
        backgroundImage:
          'radial-gradient(circle at top left, rgba(16,185,76,0.4), transparent 35%), radial-gradient(circle at top right, rgba(74,222,128,0), transparent 30%)',
      }}
    >
      <div className="relative overflow-visible" style={{ marginLeft: '80px', marginRight: '80px' }}>
        <div className="grid gap-60 lg:grid-cols-[1.6fr_300px] lg:items-start overflow-visible">
          <div className="space-y-8 pt-4 relative">
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

            <div className="relative z-50" style={{ marginRight: '-160px', width: 'calc(100% - 200px)' }}>
              <SearchBarIntro />
            </div>

            <div className="mt-6 relative z-50">
              <div className="rounded-4xl flex flex-wrap border border-emerald-500/20 bg-slate-950/95 p-4 shadow-[0_40px_120px_-80px_rgba(16,185,76,0.9)] max-w-xl">
                <div className="flex flex-wrap gap-3">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => handleSuggestionHover(suggestion)}
                  onMouseLeave={handleSuggestionLeave}
                  className="rounded-full border border-emerald-600/30 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-400 hover:bg-emerald-400/10"
                >
                  {suggestion}
                </button>
              ))}
            </div>
              </div>
            </div>
          </div>

          <div className="absolute z-30 left-140 -top-20">
            <IntroMapSection
              hoveredCityId={hoveredCity}
              loadingCityId={loadingCity}
              statusMessage={statusMessage}
              onMarkerHover={setHoveredCity}
              onMarkerLeave={() => setHoveredCity(null)}
              onMarkerClick={handleCitySearch}
            />
          </div>

          <div className="relative z-40" style={{ marginRight: '-40px' }}>
            <IntroTopHotelsSection />
          </div>
        </div>
      </div>
    </section>
  );
}

export default IntroHero;

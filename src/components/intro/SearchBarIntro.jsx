import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/app/AppContext";
import { hotelSearchService } from "@/services/backend/hotelSearch.service";
import Icon from "@/components/ui/Icon";
import DateRangePicker from "@/components/ui/DateRangePicker";
import GuestsSelector from "@/components/ui/GuestsSelector";

function SearchBarIntro() {
  const navigate = useNavigate();
  const {
    location,
    setLocation,
    dates,
    setDates,
    guests,
    setGuests,
    setHotels,
    loading,
    setLoading,
    setActiveHotel,
    radiusM,
    userLoc,
    setSearchGps
  } = useApp();

  const [showCal, setShowCal] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [addressInput, setAddressInput] = useState(location?.display || location?.address || '');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const calRef = useRef(null);
  const guestsRef = useRef(null);
  const addressRef = useRef(null);
  const suggestionTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    function handleDocumentClick(e) {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
      if (addressRef.current && !addressRef.current.contains(e.target)) setShowSuggestions(false);
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const handleAddressChange = (value) => {
    setAddressInput(value);
    setLocation(prev => ({ ...prev, address: value, display: value }));

    if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
    if (value.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    suggestionTimerRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const suggestions = await hotelSearchService.getAddressSuggestions(value, controller.signal);
        setAddressSuggestions(suggestions || []);
        setShowSuggestions((suggestions || []).length > 0);
      } catch (err) {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!controller.signal.aborted) setLoadingSuggestions(false);
      }
    }, 300);
  };

  const handleSuggestionSelect = (suggestion) => {
    const fullAddress = suggestion.display || suggestion.address || '';
    setAddressInput(fullAddress);
    setLocation({
      address: fullAddress,
      display: fullAddress,
      gps: { latitude: suggestion.latitude || 0, longitude: suggestion.longitude || 0, geohash: suggestion.geohash || '' },
      ref_id: suggestion.ref_id || ''
    });
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const { checkIn, checkOut } = dates;

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  async function handleSearch() {
    const addressStr = addressInput || location?.address || location?.display || '';
    const gpsData = location?.gps?.latitude && location?.gps?.longitude ? location.gps : { latitude: userLoc.lat, longitude: userLoc.lng, geohash: '' };

    if (!addressStr || !checkIn || !checkOut) return;

    setLoading(true);
    setActiveHotel(null);
    try {
      const response = await hotelSearchService.searchHotels({
        address: addressStr,
        gps: { latitude: gpsData.latitude, longitude: gpsData.longitude, geohash: '' },
        ref_id: location?.ref_id || '',
        check_in: formatLocalDate(checkIn),
        check_out: formatLocalDate(checkOut),
        children: Array.isArray(guests.childrenAges) ? guests.childrenAges : [],
        adults: guests.adults || 2,
        personality: ''
      });

      const results = response.hotels || response || [];
      const searchingPlace = response.searchingPlace || null;
      if (searchingPlace && searchingPlace.gps) {
        setSearchGps({ latitude: searchingPlace.gps.latitude, longitude: searchingPlace.gps.longitude });
      } else if (gpsData.latitude && gpsData.longitude) {
        setSearchGps({ latitude: gpsData.latitude, longitude: gpsData.longitude });
      }

      setHotels(results);
      navigate('/');
    } catch (error) {
      console.error('Search failed', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }

  const guestsLabel = (() => {
    const parts = [`${guests.adults} người lớn`];
    if (guests.children > 0) parts.push(`${guests.children} trẻ em`);
    return parts.join(', ');
  })();

  return (
    <div className="flex-none z-50 flex justify-center px-2 py-2" style={{ zIndex: 1000 }}>
      <div className="glass rounded-2xl shadow-editorial flex items-stretch p-2 w-full max-w-6xl border border-white/20 gap-1" style={{ zIndex: 1000, overflow: 'visible' }}>
        <div ref={addressRef} className="relative flex-1 px-3 py-1">
          <div className="flex items-center gap-2">
            <Icon name="location_on" className="text-on-surface-variant flex-none" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Địa chỉ</span>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Tìm địa điểm..."
                className="border-0 focus:ring-0 w-full text-sm font-medium bg-transparent outline-none text-on-surface p-0"
              />
            </div>
            {loadingSuggestions && <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-none" />}
          </div>

          {showSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-editorial border border-outline-variant/20 overflow-hidden max-h-80 overflow-y-auto" style={{ zIndex: 700, minWidth: 420 }}>
              {addressSuggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4 cursor-pointer text-base hover:bg-surface-container-low" onClick={() => handleSuggestionSelect(s)}>
                  <Icon name="location_on" size={18} className="text-on-surface-variant flex-none" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface truncate">{s.display}</div>
                    {s.address && s.address !== s.display && <div className="text-sm text-on-surface-variant truncate">{s.address}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 px-3 py-1">
          <div className="flex items-center gap-2 cursor-pointer" ref={calRef} onClick={(e) => { e.stopPropagation(); setShowCal(true); }}>
            <Icon name="calendar_month" className="flex-none text-emerald-600" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Check-in / Check-out</span>
              <span className="text-sm font-medium whitespace-nowrap truncate text-on-surface">{checkIn ? `${checkIn.toLocaleDateString()} – ${checkOut ? checkOut.toLocaleDateString() : '?'} ` : 'Chọn ngày'}</span>
            </div>
          </div>
          {showCal && <DateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={setDates} onClose={() => setShowCal(false)} />}
        </div>

        <div ref={guestsRef} className="relative flex-1 flex items-center gap-2 px-3 py-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowGuests(true); }}>
          <Icon name="group" className="flex-none text-emerald-600" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Số người</span>
            <span className="text-sm font-medium whitespace-nowrap truncate text-on-surface">{guestsLabel}</span>
          </div>
          {showGuests && <GuestsSelector guests={guests} onChange={setGuests} onClose={() => setShowGuests(false)} />}
        </div>

        <button type="button" onClick={(e) => { e.stopPropagation(); handleSearch(); }} disabled={loading} className="flex-none flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 active:scale-95 transition-all">
          {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang tìm...</>) : (<><Icon name="search" size={20} className="text-white" />Tìm kiếm</>)}
        </button>
      </div>
    </div>
  );
}

export default SearchBarIntro;

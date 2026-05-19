import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/AppContext";
import { hotelSearchService } from "@/services/backend/hotelSearch.service";
import Icon from "@/components/ui/Icon";
import DateRangePicker from "@/components/ui/DateRangePicker";
import GuestsSelector from "@/components/ui/GuestsSelector";
function SearchBar() {
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
    filters,
    radiusM,
    currentGps,
    userLoc,
    setSearchGps
  } = useApp();

  const [showCal, setShowCal] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [personality, setPersonality] = useState('');
  const [addressInput, setAddressInput] = useState(location?.display || location?.address || '');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState(location?.ref_id || '');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const calRef = useRef(null);
  const guestsRef = useRef(null);
  const addressRef = useRef(null);
  const suggestionTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    function handleDocumentClick(e) {
      if (calRef.current && !calRef.current.contains(e.target)) {
        setShowCal(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(e.target)) {
        setShowGuests(false);
      }
      if (addressRef.current && !addressRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      document.removeEventListener("mousedown", handleDocumentClick);
    }
  }, []);

  // Fetch address suggestions when user types
  const handleAddressChange = (value) => {
    setAddressInput(value);
    
    // Update location state with just the address string for now
    setLocation(prev => ({
      ...prev,
      address: value,
      display: value
    }));
    
    // Clear previous timer
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }
    
    // Don't fetch if input is too short
    if (value.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Debounce API call
    suggestionTimerRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);

        const suggestions = await hotelSearchService.getAddressSuggestions(value, controller.signal);
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
        }
      }
    }, 300); // 300ms debounce
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    // Use the full display text as address input
    const fullAddress = suggestion.display || suggestion.address;
    setAddressInput(fullAddress);
    setSelectedRefId(suggestion.ref_id || '');
    
    // Update location state with full suggestion data including GPS and ref_id
    setLocation({
      address: fullAddress, // Use full address
      display: fullAddress,
      gps: {
        latitude: suggestion.latitude || 0,
        longitude: suggestion.longitude || 0,
        geohash: suggestion.geohash || ''
      },
      ref_id: suggestion.ref_id || ''
    });
    
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const { checkIn, checkOut } = dates;

  const dateLabel = checkIn
    ? `${checkIn ? checkIn.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : ""} – ${checkOut ? checkOut.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "?"}`
    : "Chọn ngày";

  const guestsLabel = (() => {
    const parts = [`${guests.adults} người lớn`];
    if (guests.children > 0) parts.push(`${guests.children} trẻ em`);
    return parts.join(", ");
  })();

  async function handleSearch() {
    // Extract location data - use full address from input if location object doesn't have it
    const addressStr = addressInput || location?.address || location?.display || '';
    
    // Use user's current location for GPS if location.gps is not set
    const gpsData = location?.gps?.latitude && location?.gps?.longitude 
      ? location.gps 
      : { latitude: userLoc.lat, longitude: userLoc.lng, geohash: '' };
    
    const refId = location?.ref_id || '';
    
    if (!addressStr || !checkIn || !checkOut) {
      console.warn('Missing required search parameters');
      return;
    }
    
    setLoading(true);
    setActiveHotel(null); // Clear active hotel when searching
    
    try {
      // Format dates as ISO strings (YYYY-MM-DD) using local timezone
      // Fix: toISOString() converts to UTC which can shift the date by timezone offset
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const checkInStr = formatLocalDate(checkIn);
      const checkOutStr = formatLocalDate(checkOut);
      
      // Format children as array of ages from childrenAges
      const childrenArray = Array.isArray(guests.childrenAges) && guests.childrenAges.length > 0
        ? guests.childrenAges 
        : [];

      // Simple geohash calculation (precision 5 for ~5km accuracy)
      const calculateGeohash = (lat, lon) => {
        if (!lat || !lon) return '';
        // This is a simplified geohash - in production, use a proper geohash library
        // For now, return empty string as backend may calculate it
        return '';
      };

      const geohash = calculateGeohash(gpsData.latitude, gpsData.longitude);

      // Build request body matching API schema order
      const response = await hotelSearchService.searchHotels({
        address: addressStr,
        gps: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          geohash: geohash
        },
        ref_id: refId,
        check_in: checkInStr,
        check_out: checkOutStr,
        children: childrenArray,
        adults: guests.adults || 2,
        personality: personality || ''
      });
      
      // Extract hotels and searching_place from response
      const results = response.hotels || response || [];
      const searchingPlace = response.searchingPlace || null;
      
      // Extract searching_place GPS from response and set it for map navigation
      if (searchingPlace && searchingPlace.gps) {
        console.log('✅ Setting map GPS from searching_place:', searchingPlace.gps);
        setSearchGps({
          latitude: searchingPlace.gps.latitude,
          longitude: searchingPlace.gps.longitude
        });
      } else if (gpsData.latitude && gpsData.longitude) {
        // Fallback to search GPS if searching_place not available
        console.log('⚠️ No searching_place in response, using search GPS');
        setSearchGps({
          latitude: gpsData.latitude,
          longitude: gpsData.longitude
        });
      }
      
      setHotels(results);
    } catch (error) {
      console.error("SearchBar searchHotels failed:", error);
      // Set empty array on error to prevent infinite loading
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-none z-40 flex justify-center px-4 py-3">
      <div className="glass rounded-2xl shadow-editorial flex items-stretch p-2 w-full max-w-6xl border border-white/60 gap-1">

        {/* Location Input with Suggestions */}
        <div ref={addressRef} className="relative flex-1 px-3 py-1 border-r border-outline-variant/30">
          <div className="flex items-center gap-2">
            <Icon name="location_on" className="text-on-surface-variant flex-none" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Địa điểm</span>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Tìm địa điểm..."
                className="border-0 focus:ring-0 w-full text-sm font-medium bg-transparent outline-none text-on-surface p-0"
              />
            </div>
            {loadingSuggestions && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-none" />
            )}
          </div>

          {/* Address Suggestions Dropdown */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-editorial border border-outline-variant/20 overflow-hidden z-[400] max-h-64 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer text-sm hover:bg-surface-container-low transition-colors"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <Icon name="location_on" size={16} className="text-on-surface-variant flex-none" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-on-surface truncate">{suggestion.display}</div>
                    {suggestion.address && suggestion.address !== suggestion.display && (
                      <div className="text-xs text-on-surface-variant truncate">{suggestion.address}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personality Input */}
        <div className="flex-1 px-3 py-1 border-r border-outline-variant/30">
          <div className="flex items-center gap-2">
            <Icon name="psychology" className="text-on-surface-variant flex-none" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Yêu cầu</span>
              <input
                type="text"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Nhập yêu cầu của bạn..."
                className="border-0 focus:ring-0 w-full text-sm font-medium bg-transparent outline-none text-on-surface p-0"
              />
            </div>
          </div>
        </div>

        {/* Date Picker */}
        <div
          ref={calRef}
          className={`relative flex-1 flex items-center gap-2 px-3 py-1 cursor-pointer border-r border-outline-variant/30 transition-all duration-200 ${
            showCal ? 'bg-blue-50 border-blue-200' : 'hover:bg-surface-container-low'
          }`}
          onClick={() => {
            setShowCal((v) => !v);
            setShowGuests(false);
          }}
        >
          <Icon name="calendar_month" className={`flex-none transition-colors ${showCal ? 'text-blue-600' : 'text-on-surface-variant'}`} />
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
              showCal ? 'text-blue-600' : 'text-on-surface-variant'
            }`}>
              Check-in / Check-out
            </span>
            <span className={`text-sm font-medium whitespace-nowrap truncate transition-colors ${
              showCal ? 'text-blue-700' : 'text-on-surface'
            }`}>
              {dateLabel}
            </span>
          </div>
          {showCal && (
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={setDates}
              onClose={() => setShowCal(false)}
            />
          )}
        </div>

        {/* Guests Selector */}
        <div
          ref={guestsRef}
          className={`relative flex-1 flex items-center gap-2 px-3 py-1 cursor-pointer border-r border-outline-variant/30 transition-all duration-200 ${
            showGuests ? 'bg-blue-50 border-blue-200' : 'hover:bg-surface-container-low'
          }`}
          onClick={() => {
            setShowGuests((v) => !v);
            setShowCal(false);
          }}
        >
          <Icon name="group" className={`flex-none transition-colors ${showGuests ? 'text-blue-600' : 'text-on-surface-variant'}`} />
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
              showGuests ? 'text-blue-600' : 'text-on-surface-variant'
            }`}>
              Số người
            </span>
            <span className={`text-sm font-medium whitespace-nowrap truncate transition-colors ${
              showGuests ? 'text-blue-700' : 'text-on-surface'
            }`}>
              {guestsLabel}
            </span>
          </div>
          <Icon 
            name={showGuests ? "expand_less" : "expand_more"} 
            size={18} 
            className={`ml-auto flex-none transition-all duration-200 ${
              showGuests ? 'text-blue-600 rotate-0' : 'text-on-surface-variant'
            }`} 
          />
          {showGuests && (
            <GuestsSelector
              guests={guests}
              onChange={setGuests}
              onClose={() => setShowGuests(false)}
            />
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSearch();
          }}
          disabled={loading}
          className="flex-none flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-container active:scale-95 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang tìm...
            </>
          ) : (
            <>
              <Icon name="search" size={20} className="text-white" />
              Tìm kiếm
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SearchBar;

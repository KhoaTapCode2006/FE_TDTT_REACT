import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/AppContext";
import { searchHotels } from "@/services/backend/hotel.service";
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
    userLoc
  } = useApp();

  const [showCal, setShowCal] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [personality, setPersonality] = useState('');
  const [addressInput, setAddressInput] = useState(location || '');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const calRef = useRef(null);
  const guestsRef = useRef(null);
  const addressRef = useRef(null);
  const suggestionTimerRef = useRef(null);

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
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  // Fetch address suggestions when user types
  const handleAddressChange = (value) => {
    setAddressInput(value);
    setLocation(value);
    
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
    
    // Debounce API call
    suggestionTimerRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const suggestions = await hotelSearchService.getAddressSuggestions(value);
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setAddressInput(suggestion.display || suggestion.address);
    setLocation(suggestion.display || suggestion.address);
    setSelectedRefId(suggestion.ref_id);
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
    if (!location || !checkIn || !checkOut) {
      console.warn('Missing required search parameters');
      return;
    }
    
    setLoading(true);
    setActiveHotel(null); // Clear active hotel when searching
    
    try {
      // Convert filters to priceRange format
      const priceRange = {};
      if (filters.priceMin !== null) priceRange.minPrice = filters.priceMin;
      if (filters.priceMax !== null) priceRange.maxPrice = filters.priceMax;

      const results = await searchHotels({
        location,
        checkIn,
        checkOut,
        guests,
        priceRange,
        radius: radiusM,
        filters,
        personality, // Add personality to search params
        refId: selectedRefId // Add ref_id from address suggestion
      });
      
      console.log('Search results:', results.length, 'hotels found');
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

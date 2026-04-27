import { useEffect, useRef, useState } from "react";
import { useApp } from "@/app/AppContext";
import { searchHotels } from "@/services/backend/hotel.service";
import Icon from "@/components/ui/Icon";
import LocationInput from "@/components/ui/LocationInput";
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
  const calRef = useRef(null);
  const guestsRef = useRef(null);

  useEffect(() => {
    function handleDocumentClick(e) {
      if (calRef.current && !calRef.current.contains(e.target)) {
        setShowCal(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(e.target)) {
        setShowGuests(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  // Auto-search when location, dates, or guests change
  useEffect(() => {
    if (location && dates.checkIn && dates.checkOut && userLoc) {
      handleSearch();
    }
  }, [location, dates, guests, userLoc]);

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
    if (!location || !checkIn || !checkOut) return;
    
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
        filters
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
      <div className="glass rounded-2xl shadow-editorial flex items-stretch p-2 w-full max-w-5xl border border-white/60 gap-1">

        <div className="flex-1 px-3 py-1 border-r border-outline-variant/30">
          <LocationInput
            value={location}
            onChange={setLocation}
            onSelect={setLocation}
          />
        </div>

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

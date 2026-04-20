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
    setLoading(true);
    try {
      const results = await searchHotels({
        location,
        checkIn,
        checkOut,
        guests,
      });
      setHotels(results);
    } catch (error) {
      console.error("SearchBar searchHotels failed:", error);
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
          className="relative flex-1 flex items-center gap-2 px-3 py-1 cursor-pointer border-r border-outline-variant/30"
          onClick={() => {
            setShowCal((v) => !v);
            setShowGuests(false);
          }}
        >
          <Icon name="calendar_month" className="text-on-surface-variant flex-none" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Check-in / Check-out
            </span>
            <span className="text-sm font-medium text-on-surface whitespace-nowrap truncate">
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
          className="relative flex-1 flex items-center gap-2 px-3 py-1 cursor-pointer border-r border-outline-variant/30"
          onClick={() => {
            setShowGuests((v) => !v);
            setShowCal(false);
          }}
        >
          <Icon name="group" className="text-on-surface-variant flex-none" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Số người
            </span>
            <span className="text-sm font-medium text-on-surface whitespace-nowrap truncate">
              {guestsLabel}
            </span>
          </div>
          <Icon name="expand_more" size={18} className="text-on-surface-variant ml-auto flex-none" />
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
          <Icon name="search" size={20} className="text-white" />
          Tìm kiếm
        </button>
      </div>
    </div>
  );
}

export default SearchBar;

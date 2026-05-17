import { useState, useEffect, useRef, useCallback } from "react";
import { searchHotels } from "@/services/backend/discover.service";

/**
 * HotelSearchAutocomplete
 *
 * Search box gọi POST /discover/hotels, cho phép user chọn khách sạn.
 * `property_token` của khách sạn được chọn sẽ được dùng làm place_id.
 *
 * Props:
 *   value        {string}   - current place_id (property_token)
 *   displayValue {string}   - tên khách sạn hiển thị trong input
 *   onChange     {Function} - called with ({ placeId, display }) khi user chọn
 *   placeholder  {string}
 */
function HotelSearchAutocomplete({
  value,
  displayValue,
  onChange,
  placeholder = "Search for a hotel…",
}) {
  const [query, setQuery]           = useState(displayValue || "");
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [selected, setSelected]     = useState(!!value);

  const debounceRef  = useRef(null);
  const containerRef = useRef(null);
  const gpsRef       = useRef(null);

  // Lấy GPS một lần khi mount (best-effort)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsRef.current = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      },
      () => { /* silent fail */ },
      { timeout: 5000, maximumAge: 60_000 }
    );
  }, []);

  // Sync khi parent reset
  useEffect(() => {
    setQuery(displayValue || "");
    setSelected(!!value);
  }, [displayValue, value]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchResults = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const hotels = await searchHotels(q, gpsRef.current);
      setResults(hotels);
      setOpen(hotels.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(e) {
    const q = e.target.value;
    setQuery(q);
    setSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(q), 400);
  }

  function handleSelect(hotel) {
    setQuery(hotel.name);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onChange({ placeId: hotel.property_token, display: hotel.name });
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    setResults([]);
    setOpen(false);
    onChange({ placeId: "", display: "" });
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        {/* Search icon */}
        <span className="absolute left-3 text-gray-400 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
        />

        {/* Spinner / clear */}
        <span className="absolute right-3">
          {loading ? (
            <svg className="animate-spin text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition"
              aria-label="Clear"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </span>
      </div>

      {/* Selected badge */}
      {selected && value && (
        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Hotel selected
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((hotel) => (
            <li key={hotel.property_token}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(hotel); }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center gap-3"
              >
                {/* Thumbnail nếu có */}
                {hotel.images?.[0]?.thumbnail && (
                  <img
                    src={hotel.images[0].thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{hotel.name}</p>
                  {hotel.address && (
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{hotel.address}</p>
                  )}
                  {hotel.price != null && (
                    <p className="text-xs text-blue-500 mt-0.5">
                      {hotel.price.toLocaleString("vi-VN")}₫
                      {hotel.deal && <span className="ml-1 text-green-500">· {hotel.deal}</span>}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HotelSearchAutocomplete;

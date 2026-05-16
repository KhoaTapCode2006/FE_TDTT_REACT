import { useState, useEffect, useRef, useCallback } from "react";
import { suggestAddress } from "@/services/backend/discover.service";

/**
 * PlaceAutocomplete
 *
 * Props:
 *   value       {string}   - current place_id (ref_id)
 *   displayValue {string}  - human-readable label shown in the input
 *   onChange    {Function} - called with ({ placeId, display }) when user picks a suggestion
 *   placeholder {string}
 */
function PlaceAutocomplete({ value, displayValue, onChange, placeholder = "Search for a destination…" }) {
  const [query, setQuery]           = useState(displayValue || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [selected, setSelected]     = useState(!!value); // true once user picked an item

  const debounceRef  = useRef(null);
  const containerRef = useRef(null);
  const gpsRef       = useRef(null); // cached { latitude, longitude }

  // Attempt to get the user's current position once on mount (best-effort, silent fail)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsRef.current = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      },
      () => { /* permission denied or unavailable — proceed without GPS */ },
      { timeout: 5000, maximumAge: 60_000 }
    );
  }, []);

  // Keep local query in sync when parent resets displayValue
  useEffect(() => {
    setQuery(displayValue || "");
    setSelected(!!value);
  }, [displayValue, value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const results = await suggestAddress(q, gpsRef.current);
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(e) {
    const q = e.target.value;
    setQuery(q);
    setSelected(false);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 350);
  }

  function handleSelect(suggestion) {
    const label = suggestion.display || suggestion.name || suggestion.address || suggestion.ref_id;
    setQuery(label);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onChange({ placeId: suggestion.ref_id, display: label });
  }

  function handleClear() {
    setQuery("");
    setSelected(false);
    setSuggestions([]);
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
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-3 text-sm text-gray-700 placeholder-gray-300 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition bg-gray-50"
        />

        {/* Loading spinner / clear button */}
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
          Place selected
        </p>
      )}

      {/* Dropdown */}
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {suggestions.map((s) => {
            const label = s.display || s.name || s.address || s.ref_id;
            const sub   = s.address && s.display && s.display !== s.address ? s.address : null;
            return (
              <li key={s.ref_id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition text-sm"
                >
                  <span className="font-medium text-gray-800 line-clamp-1">{label}</span>
                  {sub && <span className="block text-xs text-gray-400 line-clamp-1 mt-0.5">{sub}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PlaceAutocomplete;

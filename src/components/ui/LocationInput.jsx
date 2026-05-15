import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { hotelSearchService } from "@/services/backend/hotelSearch.service";

function LocationInput({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e) {
    const v = e.target.value;
    onChange(v);
    clearTimeout(timerRef.current);
    if (v.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await hotelSearchService.getAddressSuggestions(v);
        console.log('LocationInput received suggestions:', results);
        console.log('Suggestions length:', results?.length);
        setSuggestions(results || []);
        setOpen((results || []).length > 0);
        console.log('Dropdown open:', (results || []).length > 0);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Icon name="location_on" className="text-on-surface-variant flex-none" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Địa điểm</span>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={() => suggestions.length && setOpen(true)}
            placeholder="Tìm địa điểm..."
            className="border-0 focus:ring-0 w-full text-sm font-medium bg-transparent outline-none text-on-surface p-0"
          />
        </div>
        {loading && (
          <Icon name="progress_activity" size={16} className="text-on-surface-variant animate-spin flex-none" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-editorial border border-outline-variant/20 overflow-hidden z-[400] max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-b-0"
              onClick={() => {
                onChange(suggestion.display || suggestion.address);
                onSelect(suggestion);
                setOpen(false);
                setSuggestions([]);
              }}
            >
              <Icon name="location_on" size={20} className="text-primary flex-none mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-on-surface truncate">
                  {suggestion.display || suggestion.address}
                </div>
                {suggestion.address && suggestion.display !== suggestion.address && (
                  <div className="text-xs text-on-surface-variant mt-0.5 truncate">
                    {suggestion.address}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationInput;

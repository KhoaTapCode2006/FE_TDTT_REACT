import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

function LocationInput({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
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
      const results = await window.API.autocomplete(v);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 250);
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
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-editorial border border-outline-variant/20 overflow-hidden z-[400]">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="autocomplete-item flex items-center gap-3 px-4 py-3 cursor-pointer text-sm hover:bg-surface-container-low transition-colors"
              onClick={() => {
                onChange(s);
                onSelect(s);
                setOpen(false);
                setSuggestions([]);
              }}
            >
              <Icon name="location_on" size={16} className="text-on-surface-variant flex-none" />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LocationInput;

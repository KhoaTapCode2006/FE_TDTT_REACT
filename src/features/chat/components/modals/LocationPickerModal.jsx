import { useState, useRef, useEffect } from "react";
import { searchHotels } from "@/services/backend/discover.service";

/**
 * Modal tìm kiếm địa điểm (khách sạn) để gửi vào chat.
 * Gọi API POST /discover/hotels theo tên người dùng nhập.
 */
function LocationPickerModal({ onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input khi mở modal
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchHotels(query.trim());
        setResults(data);
      } catch (err) {
        console.error("[LocationPickerModal] searchHotels error:", err);
        setError("Không thể tìm kiếm. Vui lòng thử lại.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (hotel) => {
    onSelect({
      name: hotel.name,
      address: hotel.address ?? "",
      propertyToken: hotel.property_token ?? "",
      gps: hotel.gps_coordinates ?? null,
    });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-sm">Tìm địa điểm</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-green-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập tên khách sạn, địa điểm..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
            {loading && (
              <svg className="w-4 h-4 text-green-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {query && !loading && (
              <button
                onClick={() => setQuery("")}
                className="w-4 h-4 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs leading-none hover:bg-gray-400 transition-colors shrink-0"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto max-h-72">
          {error && (
            <div className="px-5 py-4 text-sm text-red-500 text-center">{error}</div>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <div className="px-5 py-8 text-sm text-gray-400 text-center">
              Không tìm thấy kết quả cho "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="px-5 py-8 text-sm text-gray-400 text-center">
              Nhập tên để tìm kiếm địa điểm
            </div>
          )}

          {results.map((hotel, idx) => (
            <button
              key={hotel.property_token ?? idx}
              onClick={() => handleSelect(hotel)}
              className="w-full flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
            >
              {/* Thumbnail */}
              {hotel.images?.[0]?.thumbnail ? (
                <img
                  src={hotel.images[0].thumbnail}
                  alt={hotel.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-400 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{hotel.name}</p>
                {hotel.address && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{hotel.address}</p>
                )}
                {hotel.raw_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400 text-xs">★</span>
                    <span className="text-xs text-gray-500">{hotel.raw_rating.toFixed(1)}</span>
                    {hotel.price && (
                      <span className="text-xs text-gray-400 ml-1">
                        · {hotel.price.toLocaleString("vi-VN")}đ/đêm
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default LocationPickerModal;

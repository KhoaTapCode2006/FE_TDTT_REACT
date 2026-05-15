import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Icon from '@/components/ui/Icon';
import { discoverService } from '@/services/backend/discover.service';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 500; // 500ms for hotel search
const MAX_SUGGESTIONS = 5;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * HotelSuggestionAutocomplete Component
 * Provides autocomplete search for hotels when adding places to collections
 * 
 * Features:
 * - Debounced search (500ms)
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape, Tab)
 * - Click-outside detection
 * - Loading and error states
 * - Full accessibility support (ARIA)
 * - Request cancellation on new input
 * - Response caching (5 minutes)
 */
function HotelSuggestionAutocomplete({
  onSelect,
  placeholder = 'Tìm kiếm khách sạn...',
  disabled = false,
  className = '',
  autoFocus = false,
  ariaLabel = 'Tìm kiếm khách sạn',
}) {
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // ============================================================================
  // REFS
  // ============================================================================
  
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const containerRef = useRef(null);
  const cacheRef = useRef(new Map());
  
  // ============================================================================
  // CACHE UTILITIES
  // ============================================================================
  
  const getCachedResults = useCallback((searchTerm) => {
    const cached = cacheRef.current.get(searchTerm);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.results;
    }
    return null;
  }, []);
  
  const setCachedResults = useCallback((searchTerm, results) => {
    cacheRef.current.set(searchTerm, {
      results,
      timestamp: Date.now(),
    });
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleSelect = useCallback((hotel) => {
    if (!hotel.property_token) {
      console.warn('Cannot select hotel without property_token:', hotel);
      return;
    }
    
    onSelect(hotel);
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onSelect]);
  
  const handleKeyDown = useCallback((event) => {
    if (!isOpen || suggestions.length === 0) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setInputValue('');
        setHighlightedIndex(-1);
      }
      return;
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev + 1;
          return next >= suggestions.length ? 0 : next;
        });
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? suggestions.length - 1 : next;
        });
        break;
        
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setInputValue('');
        setHighlightedIndex(-1);
        break;
        
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
        
      default:
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, handleSelect]);
  
  const handleClickOutside = useCallback((event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);
  
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (!inputValue || inputValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    debounceTimerRef.current = setTimeout(async () => {
      const trimmedTerm = inputValue.trim();
      
      const cachedResults = getCachedResults(trimmedTerm);
      if (cachedResults) {
        setSuggestions(cachedResults);
        setIsOpen(true);
        setError(null);
        setHighlightedIndex(-1);
        setIsLoading(false);
        return;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      try {
        const results = await discoverService.searchHotels(
          trimmedTerm,
          { latitude: 10.75887508, longitude: 106.67538868 }, // Default GPS coordinates (Ho Chi Minh City)
          { signal: abortControllerRef.current.signal }
        );
        
        setCachedResults(trimmedTerm, results);
        
        setSuggestions(results);
        setIsOpen(true);
        setError(null);
        setHighlightedIndex(-1);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          return;
        }
        
        console.error('Hotel search error:', err);
        setSuggestions([]);
        setError(err);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, getCachedResults, setCachedResults]);
  
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const getErrorMessage = () => {
    if (!error) return null;
    
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Không có kết nối mạng';
      case 'TIMEOUT_ERROR':
        return 'Yêu cầu quá thời gian. Vui lòng thử lại';
      case 'SERVER_ERROR':
        return 'Không thể tải gợi ý khách sạn';
      case 'AUTH_ERROR':
        return 'Phiên đăng nhập hết hạn';
      case 'VALIDATION_ERROR':
        return 'Vui lòng nhập ít nhất 2 ký tự';
      default:
        return 'Không thể tải gợi ý khách sạn';
    }
  };
  
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div ref={containerRef} className={`relative isolate ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full rounded-3xl border border-outline-variant/70 bg-surface-container px-6 py-3 pr-12 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="hotel-suggestions-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `hotel-suggestion-${highlightedIndex}` : undefined}
          aria-describedby={error ? 'hotel-autocomplete-error' : undefined}
          role="combobox"
        />
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin">
              <Icon name="progress_activity" size={20} className="text-on-surface-variant" />
            </div>
          </div>
        )}
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div 
          id="hotel-suggestions-listbox"
          role="listbox"
          aria-label="Gợi ý khách sạn"
          className="absolute z-[9999] mt-2 w-full rounded-2xl bg-white shadow-2xl border border-outline-variant/30 overflow-hidden"
        >
          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
              Đang tìm kiếm...
            </div>
          )}
          
          {/* Error State */}
          {!isLoading && error && (
            <div 
              id="hotel-autocomplete-error"
              role="alert"
              aria-live="polite"
              className="px-4 py-3 text-sm text-red-600 flex items-center justify-center gap-2"
            >
              <Icon name="error" size={16} className="text-red-600" />
              {getErrorMessage()}
            </div>
          )}
          
          {/* Empty Results */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
              Không tìm thấy khách sạn phù hợp
            </div>
          )}
          
          {/* Suggestions List */}
          {!isLoading && !error && suggestions.length > 0 && (
            <>
              <div 
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {suggestions.length} gợi ý có sẵn
              </div>
              
              <ul className="max-h-96 overflow-y-auto">
                {suggestions.slice(0, MAX_SUGGESTIONS).map((hotel, index) => (
                  <li
                    key={hotel.property_token || index}
                    id={`hotel-suggestion-${index}`}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    onClick={() => handleSelect(hotel)}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-outline-variant/20 last:border-b-0 ${
                      index === highlightedIndex
                        ? 'bg-surface-container-high'
                        : 'hover:bg-surface-container-high'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Hotel Image */}
                      {hotel.images?.[0]?.thumbnail ? (
                        <img 
                          src={hotel.images[0].thumbnail} 
                          alt={hotel.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                          <Icon name="hotel" size={32} className="text-on-surface-variant" />
                        </div>
                      )}
                      
                      {/* Hotel Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {hotel.name}
                        </p>
                        
                        {hotel.price && (
                          <p className="text-sm font-medium text-primary">
                            {formatPrice(hotel.price)}
                          </p>
                        )}
                        
                        {hotel.deal && (
                          <p className="text-xs text-green-600 truncate">
                            {hotel.deal}
                          </p>
                        )}
                        
                        {hotel.ai_sentiment?.ai_score && (
                          <div className="flex items-center gap-1">
                            <Icon name="star" size={14} className="text-yellow-500" />
                            <span className="text-xs text-on-surface-variant">
                              {hotel.ai_sentiment.ai_score.toFixed(1)}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(HotelSuggestionAutocomplete);

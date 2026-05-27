import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { addressSuggestService } from '@/services/external/addressSuggest.service';
import Icon from '@/components/ui/Icon';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 300; // 300ms
const MAX_SUGGESTIONS = 10;

// ============================================================================
// TYPE DEFINITIONS (JSDoc)
// ============================================================================

/**
 * @typedef {Object} SuggestionItem
 * @property {string} address - Full address text
 * @property {string} name - Place name
 * @property {string} display - Display text (formatted for UI)
 * @property {number} distance - Distance from user location (meters)
 * @property {string} ref_id - Unique identifier (used as place_id)
 */

/**
 * @typedef {Object} AddressAutocompleteProps
 * @property {Function} onSelect - Callback when suggestion is selected. Signature: (suggestion: SuggestionItem) => void
 * @property {string} [placeholder='Tìm kiếm địa điểm...'] - Input placeholder text
 * @property {boolean} [disabled=false] - Whether input is disabled
 * @property {string} [className=''] - Additional CSS classes
 * @property {boolean} [autoFocus=false] - Whether to auto-focus input on mount
 * @property {string} [ariaLabel='Tìm kiếm địa điểm'] - ARIA label for accessibility
 */

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AddressAutocomplete Component
 * Provides autocomplete search for places using address-suggest API
 * 
 * Features:
 * - Debounced search (300ms)
 * - Keyboard navigation (ArrowUp/Down, Enter, Escape, Tab)
 * - Click-outside detection
 * - Loading and error states
 * - Full accessibility support (ARIA)
 * - Request cancellation on new input
 * - Response caching (5 minutes)
 * 
 * @param {AddressAutocompleteProps} props
 */
function AddressAutocomplete({
  onSelect,
  placeholder = 'Tìm kiếm địa điểm...',
  disabled = false,
  className = '',
  autoFocus = false,
  ariaLabel = 'Tìm kiếm địa điểm',
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
  
  /**
   * Get cached results for search term
   */
  const getCachedResults = useCallback((searchTerm) => {
    const cached = cacheRef.current.get(searchTerm);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      return cached.results;
    }
    return null;
  }, []);
  
  /**
   * Store results in cache
   */
  const setCachedResults = useCallback((searchTerm, results) => {
    cacheRef.current.set(searchTerm, {
      results,
      timestamp: Date.now(),
    });
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  /**
   * Handle suggestion selection
   */
  const handleSelect = useCallback((suggestion) => {
    if (!suggestion.ref_id) {
      console.warn('Cannot select suggestion without ref_id:', suggestion);
      return;
    }
    
    onSelect(suggestion);
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onSelect]);
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event) => {
    if (!isOpen || suggestions.length === 0) {
      // Handle Escape to close dropdown even when no suggestions
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
  
  /**
   * Handle click outside
   */
  const handleClickOutside = useCallback((event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Click-outside detection effect
   */
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Debounced search effect
   * Triggers API call 300ms after user stops typing
   */
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Reset state if input is empty
    if (!inputValue || inputValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    // Set loading state immediately
    setIsLoading(true);
    setError(null);
    
    // Debounce API call by 300ms
    debounceTimerRef.current = setTimeout(async () => {
      const trimmedTerm = inputValue.trim();
      
      // Check cache first
      const cachedResults = getCachedResults(trimmedTerm);
      if (cachedResults) {
        setSuggestions(cachedResults);
        setIsOpen(true);
        setError(null);
        setHighlightedIndex(-1);
        setIsLoading(false);
        return;
      }
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      try {
        const results = await addressSuggestService.searchPlaces(
          trimmedTerm,
          { signal: abortControllerRef.current.signal }
        );
        
        // Store in cache
        setCachedResults(trimmedTerm, results);
        
        setSuggestions(results);
        setIsOpen(true);
        setError(null);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
        setError(err);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);
    
    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue, getCachedResults, setCachedResults]);
  
  /**
   * Cleanup effect - cancel pending requests on unmount
   */
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
  // RENDER
  // ============================================================================
  
  /**
   * Get error message based on error code
   */
  const getErrorMessage = () => {
    if (!error) return null;
    
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Không có kết nối mạng';
      case 'TIMEOUT_ERROR':
        return 'Yêu cầu quá thời gian. Vui lòng thử lại';
      case 'SERVER_ERROR':
        if (error.statusCode === 404) {
          return 'Không tìm thấy địa điểm';
        } else if (error.statusCode === 500) {
          return 'Lỗi server. Vui lòng thử lại sau';
        }
        return 'Không thể tải gợi ý địa chỉ';
      default:
        return 'Không thể tải gợi ý địa chỉ';
    }
  };
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
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
          aria-controls="suggestions-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined}
          aria-describedby={error ? 'autocomplete-error' : undefined}
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
          id="suggestions-listbox"
          role="listbox"
          aria-label="Gợi ý địa điểm"
          className="absolute z-50 mt-2 w-full rounded-2xl bg-surface-container shadow-lg border border-outline-variant/30 overflow-hidden"
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
              id="autocomplete-error"
              role="alert"
              aria-live="polite"
              className="px-4 py-3 text-sm text-red-600 text-center"
            >
              {getErrorMessage()}
            </div>
          )}
          
          {/* Empty Results */}
          {!isLoading && !error && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
              Không tìm thấy địa điểm phù hợp
            </div>
          )}
          
          {/* Suggestions List */}
          {!isLoading && !error && suggestions.length > 0 && (
            <>
              {/* Screen reader announcement */}
              <div 
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {suggestions.length} gợi ý có sẵn
              </div>
              
              <ul className="max-h-80 overflow-y-auto">
                {suggestions.slice(0, MAX_SUGGESTIONS).map((suggestion, index) => (
                  <li
                    key={suggestion.ref_id || index}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    onClick={() => handleSelect(suggestion)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-surface-container-high'
                        : 'hover:bg-surface-container-high'
                    } ${!suggestion.ref_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon name="place" size={20} className="text-on-surface-variant flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-on-surface line-clamp-1">
                          {suggestion.display}
                        </div>
                        {suggestion.distance > 0 && (
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            {(suggestion.distance / 1000).toFixed(1)} km
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

export default memo(AddressAutocomplete);

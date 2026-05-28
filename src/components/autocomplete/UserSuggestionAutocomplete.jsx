import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import { userService } from '@/services/backend/user.service';

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
 * @typedef {Object} UserItem
 * @property {string} uid - Unique user identifier (Firebase UID)
 * @property {string} username - Username (unique, 3-20 characters)
 * @property {string} display_name - Display name (user's full name)
 * @property {string|null} avatar_url - Avatar image URL or null
 */

/**
 * @typedef {Object} UserSuggestionAutocompleteProps
 * @property {Function} onSelect - Callback when user is selected. Signature: (user: UserItem) => void
 * @property {string} [placeholder='Tìm kiếm người dùng...'] - Input placeholder text
 * @property {boolean} [disabled=false] - Whether input is disabled
 * @property {string} [className=''] - Additional CSS classes
 * @property {boolean} [autoFocus=false] - Whether to auto-focus input on mount
 * @property {string} [ariaLabel='Tìm kiếm người dùng'] - ARIA label for accessibility
 */

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * UserSuggestionAutocomplete Component
 * Provides autocomplete search for users when adding contributors to collections
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
 * @param {UserSuggestionAutocompleteProps} props
 */
function UserSuggestionAutocomplete({
  onSelect,
  placeholder = 'Tìm kiếm người dùng...',
  disabled = false,
  className = '',
  autoFocus = false,
  ariaLabel = 'Tìm kiếm người dùng',
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // ============================================================================
  // REFS
  // ============================================================================
  
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
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
   * Handle user selection
   */
  const handleSelect = useCallback((user) => {
    if (!user.uid) {
      console.warn('Cannot select user without uid:', user);
      return;
    }
    
    onSelect(user);
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
    // Only close if click is outside BOTH container and dropdown portal
    const isClickInsideContainer = containerRef.current && containerRef.current.contains(event.target);
    const isClickInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
    
    if (!isClickInsideContainer && !isClickInsideDropdown) {
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
  
  /**
   * Debounced search effect
   * Triggers API call 300ms after user stops typing
   */
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Reset state if input is empty or less than 2 characters
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
        const results = await userService.searchUsers(
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
        // Don't show error if request was aborted
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          return;
        }
        
        console.error('User search error:', err);
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

  /**
   * Update dropdown position when isOpen changes
   */
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    // Update position immediately and on scroll/resize
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // ============================================================================
  // RENDER HELPERS
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
          return 'Không tìm thấy người dùng';
        } else if (error.statusCode === 500) {
          return 'Lỗi server. Vui lòng thử lại sau';
        }
        return 'Không thể tải gợi ý người dùng';
      case 'AUTH_ERROR':
        return 'Phiên đăng nhập hết hạn';
      case 'VALIDATION_ERROR':
        return 'Vui lòng nhập ít nhất 2 ký tự';
      default:
        return 'Không thể tải gợi ý người dùng';
    }
  };
  
  /**
   * Get placeholder avatar with first letter of username
   */
  const getPlaceholderAvatar = (username) => {
    const firstLetter = username ? username.charAt(0).toUpperCase() : '?';
    return (
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium">
        {firstLetter}
      </div>
    );
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
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
          aria-controls="user-suggestions-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `user-suggestion-${highlightedIndex}` : undefined}
          aria-describedby={error ? 'user-autocomplete-error' : undefined}
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
      
      {/* Dropdown - Rendered via Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          id="user-suggestions-listbox"
          role="listbox"
          aria-label="Gợi ý người dùng"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          className="rounded-2xl bg-white shadow-2xl border border-outline-variant/30 overflow-hidden"
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
              id="user-autocomplete-error"
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
              Không tìm thấy người dùng phù hợp
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
                {suggestions.slice(0, MAX_SUGGESTIONS).map((user, index) => (
                  <li
                    key={user.uid || index}
                    id={`user-suggestion-${index}`}
                    role="option"
                    aria-selected={index === highlightedIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(user);
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-surface-container-high'
                        : 'hover:bg-surface-container-high'
                    } ${!user.uid ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={`${user.username} avatar`}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        getPlaceholderAvatar(user.username)
                      )}
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="text-sm font-medium text-on-surface truncate">
                          {user.username}
                        </div>
                        <div className="text-xs text-on-surface-variant truncate">
                          {user.display_name}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export default memo(UserSuggestionAutocomplete);

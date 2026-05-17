/**
 * Geolocation Service
 * * Handles user location requests, caching, and management.
 * Provides fallback to default location (Ben Thanh Market, HCMC) when permission is denied.
 * * Requirements: 4.1, 4.2, 4.3, 4.4
 */

const STORAGE_KEY = 'user_geolocation';
const CACHE_DURATION_MS = 3600000; // 1 hour in milliseconds

// Default location: Ben Thanh Market, Ho Chi Minh City, Vietnam
const DEFAULT_LOCATION = {
  latitude: 10.7769,
  longitude: 106.7009,
  geohash: 'w3gvk1g8'
};

/**
 * Geolocation Service
 * Manages user location with browser Geolocation API and localStorage caching
 */
export const geolocationService = {
  /**
   * Request user's current location from browser
   * @returns {Promise<{latitude: number, longitude: number, geohash: string}>}
   */
  async requestUserLocation() {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser, using default location');
      return DEFAULT_LOCATION;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // FIX: Thay 'this' bằng 'geolocationService' để tránh lỗi undefined context
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            geohash: geolocationService.generateGeohash(
              position.coords.latitude,
              position.coords.longitude
            )
          };
          
          // FIX: Thay 'this' bằng 'geolocationService'
          geolocationService.saveLocation(coords);
          
          console.log('User location obtained:', coords);
          resolve(coords);
        },
        (error) => {
          // Handle geolocation errors gracefully
          console.warn('Geolocation error:', error.message);
          
          if (error.code === error.PERMISSION_DENIED) {
            console.info('User denied geolocation permission, using default location');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            console.warn('Location information unavailable, using default location');
          } else if (error.code === error.TIMEOUT) {
            console.warn('Geolocation request timed out, using default location');
          }
          
          // Always resolve with default location (never reject)
          resolve(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  },

  /**
   * Get user location (from cache or request new)
   * @returns {Promise<{latitude: number, longitude: number, geohash: string}>}
   */
  async getUserLocation() {
    // FIX: Thay 'this' bằng 'geolocationService'
    const stored = geolocationService.getStoredLocation();
    if (stored) {
      console.log('Using cached location:', stored);
      return stored;
    }
    
    // Cache miss or expired - request new location
    console.log('No cached location found, requesting new location');
    // FIX: Thay 'this' bằng 'geolocationService'
    return await geolocationService.requestUserLocation();
  },

  /**
   * Save location to localStorage with timestamp
   * @param {{latitude: number, longitude: number, geohash: string}} coords
   */
  saveLocation(coords) {
    try {
      const data = {
        ...coords,
        timestamp: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('Location saved to localStorage');
    } catch (error) {
      console.error('Failed to save location to localStorage:', error);
    }
  },

  /**
   * Get stored location from localStorage if not expired
   * @returns {{latitude: number, longitude: number, geohash: string}|null}
   */
  getStoredLocation() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored);
      const age = Date.now() - data.timestamp;
      
      // Check if cache has expired (1 hour)
      if (age > CACHE_DURATION_MS) {
        console.log('Cached location expired, clearing cache');
        // FIX: Thay 'this' bằng 'geolocationService'
        geolocationService.clearLocation();
        return null;
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        geohash: data.geohash
      };
    } catch (error) {
      console.error('Failed to get stored location:', error);
      // FIX: Thay 'this' bằng 'geolocationService'
      geolocationService.clearLocation();
      return null;
    }
  },

  /**
   * Clear stored location from localStorage (called on logout)
   */
  clearLocation() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Location cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear location from localStorage:', error);
    }
  },

  /**
   * Generate geohash from coordinates
   */
  generateGeohash(lat, lng) {
    const latPrefix = lat >= 0 ? 'n' : 's';
    const lngPrefix = lng >= 0 ? 'e' : 'w';
    
    const latEncoded = Math.abs(Math.round(lat * 10000)).toString(36);
    const lngEncoded = Math.abs(Math.round(lng * 10000)).toString(36);
    
    return `${latPrefix}${lngPrefix}${latEncoded}${lngEncoded}`.substring(0, 12);
  },

  /**
   * Get default location (Ben Thanh Market, HCMC)
   */
  getDefaultLocation() {
    return { ...DEFAULT_LOCATION };
  }
};

// Export individual functions for direct use (Giữ nguyên đoạn bóc tách này của bạn)
export const {
  requestUserLocation,
  getUserLocation,
  saveLocation,
  getStoredLocation,
  clearLocation,
  generateGeohash,
  getDefaultLocation
} = geolocationService;

export default geolocationService;
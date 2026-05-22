import { useState, useEffect } from 'react';

/**
 * Global image cache using Map for efficient lookups
 */
const imageCache = new Map();

/**
 * Custom hook for caching and preloading images
 * @param {string} url - The image URL to cache
 * @returns {Object} - { cachedUrl, isLoading, error }
 */
export function useImageCache(url) {
  const [cachedUrl, setCachedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }
    
    // Check cache first
    if (imageCache.has(url)) {
      setCachedUrl(imageCache.get(url));
      setIsLoading(false);
      return;
    }
    
    // Preload image
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(url, url);
      setCachedUrl(url);
      setIsLoading(false);
      setError(null);
    };
    
    img.onerror = (e) => {
      const errorMsg = `Failed to load image: ${url}`;
      setError(new Error(errorMsg));
      setIsLoading(false);
    };
    
    img.src = url;
    
    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);
  
  return { cachedUrl, isLoading, error };
}

/**
 * Clear the entire image cache
 */
export function clearImageCache() {
  imageCache.clear();
}

/**
 * Remove a specific URL from the cache
 * @param {string} url - The URL to remove
 */
export function removeFromCache(url) {
  imageCache.delete(url);
}

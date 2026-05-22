import { useState, useEffect } from 'react';

/**
 * Global image cache using Map for efficient lookups
 */
const imageCache = new Map();
// Track URLs that previously failed to load to avoid retrying
const failedImageSet = new Set();

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
    
    // If this URL previously failed, short-circuit to avoid re-requesting
    if (failedImageSet.has(url)) {
      setError(new Error(`Previously failed to load image: ${url}`));
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
      // Mark as failed so we don't retry repeatedly
      try { failedImageSet.add(url); } catch (err) { /* ignore */ }
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

/**
 * Mark a URL as failed (prevent future retries)
 * @param {string} url
 */
export function markFailedUrl(url) {
  if (!url) return;
  failedImageSet.add(url);
}

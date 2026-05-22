/**
 * Image utility functions for optimizing and handling hotel images
 */

/**
 * Optimizes Google image URL parameters for better quality
 * Replaces s1024 parameters with s4096 for highest resolution
 * @param {string} url - The original image URL
 * @returns {string} - The optimized image URL
 */
export function optimizeGoogleImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Check if it's a Google image URL
  if (!url.includes('googleusercontent.com') && !url.includes('ggpht.com')) {
    return url;
  }
  
  // Replace size parameters for better quality
  // s1024-w1024-h1024 -> s4096-w4096-h4096 for highest resolution
  const optimized = url
    .replace(/s\d+-w\d+-h\d+/g, 's1024-w1024-h1024')
    .replace(/=s\d+/g, '=s4096');
  
  return optimized;
}

/**
 * Gets the best available image URL with fallback strategy
 * Priority: original -> thumbnail -> url
 * @param {Object} imageObj - Image object from API response
 * @returns {string|null} - The best available image URL or null
 */
export function getImageWithFallback(imageObj) {
  if (!imageObj) return null;
  
  // Try original first (highest quality)
  if (imageObj.original) return optimizeGoogleImageUrl(imageObj.original);
  
  // Fallback to thumbnail
  if (imageObj.thumbnail) return optimizeGoogleImageUrl(imageObj.thumbnail);
  
  // Fallback to url
  
  return null;
}

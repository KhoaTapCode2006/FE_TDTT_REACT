/**
 * RequestDeduplicator Utility
 * Prevents duplicate concurrent API requests by caching pending requests
 * and returning the same promise for identical requests
 */
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Generate a unique key for a request
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} url - Request URL
   * @param {Object} data - Request data/params
   * @returns {string} Unique request key
   */
  generateKey(method, url, data = null) {
    const dataKey = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataKey}`;
  }

  /**
   * Execute a request with deduplication
   * @param {string} key - Unique request key
   * @param {Function} requestFn - Function that returns a Promise
   * @returns {Promise} Request promise
   */
  async deduplicate(key, requestFn) {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`[RequestDeduplicator] Reusing pending request: ${key}`);
      return this.pendingRequests.get(key);
    }

    // Execute new request
    console.log(`[RequestDeduplicator] Executing new request: ${key}`);
    const requestPromise = requestFn()
      .finally(() => {
        // Remove from pending requests when complete
        this.pendingRequests.delete(key);
      });

    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   * @returns {number}
   */
  getPendingCount() {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();
export default requestDeduplicator;

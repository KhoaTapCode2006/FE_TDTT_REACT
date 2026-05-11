import { auth } from '../config/firebase.js';

/**
 * Token Manager for handling Firebase ID token caching and refresh
 * Prevents multiple simultaneous refresh requests and manages token expiration
 */
class TokenManager {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiration = null;
    this.refreshPromise = null;
    this.expirationThreshold = 55 * 60 * 1000; // 55 minutes in milliseconds
  }

  /**
   * Get current Firebase ID token
   * Returns cached token if valid, otherwise refreshes
   * @param {boolean} forceRefresh - Force token refresh
   * @returns {Promise<string>} Firebase ID token
   */
  async getToken(forceRefresh = false) {
    // Return cached token if valid and not forcing refresh
    if (!forceRefresh && this.cachedToken && !this.isTokenExpired()) {
      return this.cachedToken;
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start new refresh
    this.refreshPromise = this.refreshTokenInternal(forceRefresh);

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Internal method to refresh token from Firebase
   * @param {boolean} forceRefresh - Force token refresh
   * @returns {Promise<string>} New Firebase ID token
   */
  async refreshTokenInternal(forceRefresh) {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Get fresh token from Firebase
      const token = await user.getIdToken(forceRefresh);
      
      // Cache token and set expiration (1 hour from now)
      this.cachedToken = token;
      this.tokenExpiration = Date.now() + (60 * 60 * 1000); // 1 hour

      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // Clear cached token on error
      this.clearToken();
      
      throw new Error('Failed to refresh authentication token');
    }
  }

  /**
   * Check if cached token is expired or about to expire
   * @returns {boolean} True if token is expired or about to expire
   */
  isTokenExpired() {
    if (!this.tokenExpiration) {
      return true;
    }

    // Check if token will expire within threshold (55 minutes)
    const timeUntilExpiration = this.tokenExpiration - Date.now();
    return timeUntilExpiration < this.expirationThreshold;
  }

  /**
   * Get token expiration timestamp
   * @returns {number|null} Expiration timestamp or null
   */
  getTokenExpiration() {
    return this.tokenExpiration;
  }

  /**
   * Clear cached token and expiration
   */
  clearToken() {
    this.cachedToken = null;
    this.tokenExpiration = null;
    this.refreshPromise = null;
  }

  /**
   * Set token and expiration manually (for testing or session restoration)
   * @param {string} token - Firebase ID token
   * @param {number} expiration - Expiration timestamp
   */
  setToken(token, expiration) {
    this.cachedToken = token;
    this.tokenExpiration = expiration;
  }

  /**
   * Check if token needs refresh soon
   * @returns {boolean} True if token should be refreshed proactively
   */
  shouldRefreshToken() {
    return this.isTokenExpired();
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
export default tokenManager;

/**
 * Session service for handling localStorage-based session persistence
 * Manages user session data and token expiration for backend API integration
 */
class SessionService {
  constructor() {
    this.storageKey = 'b4lu_session';
    
    // Listen for storage events for cross-tab synchronization
    this.setupStorageListener();
  }

  /**
   * Set user session in localStorage
   * @param {Object} sessionData - Session data to store
   * @param {string} sessionData.uid - User ID
   * @param {string} sessionData.email - User email
   * @param {string} sessionData.username - Username
   * @param {string} sessionData.display_name - Display name
   * @param {number} sessionData.tokenExpiration - Token expiration timestamp
   * @param {boolean} sessionData.rememberMe - Remember me preference
   * @returns {void}
   */
  setSession(sessionData) {
    try {
      const session = {
        uid: sessionData.uid,
        email: sessionData.email,
        username: sessionData.username,
        display_name: sessionData.display_name,
        tokenExpiration: sessionData.tokenExpiration,
        rememberMe: sessionData.rememberMe || false,
        lastActivity: Date.now(),
        createdAt: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(session));
      
      // Dispatch custom event for cross-tab synchronization
      this.dispatchSessionEvent('session_set', session);
      
    } catch (error) {
      console.error('Error setting session:', error);
      throw new Error('Failed to create session. Please try again.');
    }
  }

  /**
   * Get current session data
   * @returns {Object|null} Session data or null if no session
   */
  getSession() {
    try {
      const sessionStr = localStorage.getItem(this.storageKey);
      
      if (!sessionStr) {
        return null;
      }
      
      return JSON.parse(sessionStr);
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Check if user has a valid session
   * @returns {boolean} True if session exists and is not expired
   */
  hasValidSession() {
    const session = this.getSession();
    if (!session) return false;
    
    // Check if token is expired
    if (this.isTokenExpired()) {
      return false;
    }
    
    // Check if session is expired based on last activity
    const lastActivity = session.lastActivity || 0;
    const maxInactivity = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
    
    return (Date.now() - lastActivity) < maxInactivity;
  }

  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired
   */
  isTokenExpired() {
    const session = this.getSession();
    if (!session || !session.tokenExpiration) {
      return true;
    }
    
    // Token is expired if current time is past expiration
    return Date.now() >= session.tokenExpiration;
  }

  /**
   * Update session activity timestamp
   * @returns {void}
   */
  updateActivity() {
    try {
      const session = this.getSession();
      if (session) {
        session.lastActivity = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  /**
   * Refresh token expiration
   * @param {string} newToken - New access token (not stored, just for reference)
   * @returns {void}
   */
  refreshToken(newToken) {
    try {
      const session = this.getSession();
      if (!session) {
        throw new Error('No active session to refresh');
      }
      
      // Update token expiration (1 hour from now)
      session.tokenExpiration = Date.now() + (60 * 60 * 1000);
      session.lastActivity = Date.now();
      
      localStorage.setItem(this.storageKey, JSON.stringify(session));
      
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh session. Please sign in again.');
    }
  }

  /**
   * Clear all session data
   * @returns {void}
   */
  clearSession() {
    try {
      // Remove session from localStorage
      localStorage.removeItem(this.storageKey);
      
      // Dispatch logout event for cross-tab synchronization
      this.dispatchSessionEvent('session_cleared', null);
      
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  /**
   * Set up storage event listener for cross-tab synchronization
   * @returns {void}
   */
  setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey) {
        // Session data changed in another tab
        const newSessionData = event.newValue ? JSON.parse(event.newValue) : null;
        
        if (!newSessionData) {
          // Session was cleared in another tab
          this.handleCrossTabLogout();
        } else {
          // Session was updated in another tab
          this.handleCrossTabUpdate(newSessionData);
        }
      }
    });
    
    // Listen for custom session events
    window.addEventListener('b4lu_session_event', (event) => {
      const { type, data } = event.detail;
      
      switch (type) {
        case 'session_cleared':
          this.handleCrossTabLogout();
          break;
        case 'session_set':
          this.handleCrossTabUpdate(data);
          break;
      }
    });
  }

  /**
   * Handle logout from another tab
   * @returns {void}
   */
  handleCrossTabLogout() {
    // Clear local session without dispatching events (to avoid loops)
    localStorage.removeItem(this.storageKey);
    
    // Notify auth service about logout
    window.dispatchEvent(new CustomEvent('auth_state_changed', {
      detail: { user: null, reason: 'cross_tab_logout' }
    }));
  }

  /**
   * Handle session update from another tab
   * @param {Object} sessionData - Updated session data
   * @returns {void}
   */
  handleCrossTabUpdate(sessionData) {
    // Update local activity timestamp
    this.updateActivity();
    
    // Notify auth service about session update
    window.dispatchEvent(new CustomEvent('auth_state_changed', {
      detail: { user: sessionData, reason: 'cross_tab_update' }
    }));
  }

  /**
   * Dispatch custom session event for cross-tab communication
   * @param {string} type - Event type
   * @param {Object} data - Event data
   * @returns {void}
   */
  dispatchSessionEvent(type, data) {
    window.dispatchEvent(new CustomEvent('b4lu_session_event', {
      detail: { type, data }
    }));
  }

  /**
   * Get session expiration info
   * @returns {Object|null} Expiration info or null if no session
   */
  getSessionExpiration() {
    const session = this.getSession();
    if (!session) return null;
    
    const lastActivity = session.lastActivity || 0;
    const tokenExpiration = session.tokenExpiration || 0;
    const maxInactivity = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const sessionExpiresAt = lastActivity + maxInactivity;
    
    return {
      lastActivity: new Date(lastActivity),
      tokenExpiresAt: new Date(tokenExpiration),
      sessionExpiresAt: new Date(sessionExpiresAt),
      isTokenExpired: Date.now() >= tokenExpiration,
      isSessionExpired: Date.now() >= sessionExpiresAt,
      timeUntilTokenExpiry: Math.max(0, tokenExpiration - Date.now()),
      timeUntilSessionExpiry: Math.max(0, sessionExpiresAt - Date.now())
    };
  }

  /**
   * Extend session if remember me is enabled
   * @returns {void}
   */
  extendSession() {
    try {
      const session = this.getSession();
      if (!session || !session.rememberMe) return;
      
      // Update activity timestamp
      this.updateActivity();
      
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }

  /**
   * Clean up expired sessions
   * @returns {void}
   */
  cleanupExpiredSessions() {
    if (!this.hasValidSession()) {
      this.clearSession();
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
export default sessionService;

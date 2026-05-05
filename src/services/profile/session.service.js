import Cookies from 'js-cookie';

/**
 * Session service for handling cookie-based session persistence
 */
class SessionService {
  constructor() {
    this.cookieNames = {
      accessToken: 'b4lu_access_token',
      refreshToken: 'b4lu_refresh_token',
      userId: 'b4lu_user_id',
      rememberMe: 'b4lu_remember_me',
      sessionData: 'b4lu_session'
    };
    
    this.cookieOptions = {
      secure: import.meta.env.PROD, // Only secure in production
      sameSite: 'strict',
      path: '/'
    };
    
    // Listen for storage events for cross-tab synchronization
    this.setupStorageListener();
  }

  /**
   * Set user session with cookies
   * @param {Object} user - Firebase user object
   * @param {boolean} rememberMe - Whether to remember the user
   * @returns {Promise<void>}
   */
  async setSession(user, rememberMe = false) {
    try {
      // Get ID token from Firebase user
      const idToken = await user.getIdToken();
      const refreshToken = user.refreshToken;
      
      // Calculate expiration times
      const accessTokenExpiry = rememberMe ? 30 : 1; // 30 days or 1 day
      const refreshTokenExpiry = rememberMe ? 30 : 7; // 30 days or 7 days
      
      // Session data for localStorage (non-sensitive)
      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        rememberMe,
        lastActivity: Date.now()
      };
      
      // Set cookies with appropriate expiration
      Cookies.set(this.cookieNames.accessToken, idToken, {
        ...this.cookieOptions,
        expires: accessTokenExpiry
      });
      
      Cookies.set(this.cookieNames.refreshToken, refreshToken, {
        ...this.cookieOptions,
        expires: refreshTokenExpiry
      });
      
      Cookies.set(this.cookieNames.userId, user.uid, {
        ...this.cookieOptions,
        expires: accessTokenExpiry
      });
      
      Cookies.set(this.cookieNames.rememberMe, rememberMe.toString(), {
        ...this.cookieOptions,
        expires: accessTokenExpiry
      });
      
      // Store session data in localStorage for cross-tab sync
      localStorage.setItem(this.cookieNames.sessionData, JSON.stringify(sessionData));
      
      // Dispatch custom event for cross-tab synchronization
      this.dispatchSessionEvent('session_set', sessionData);
      
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
      const accessToken = Cookies.get(this.cookieNames.accessToken);
      const userId = Cookies.get(this.cookieNames.userId);
      const rememberMe = Cookies.get(this.cookieNames.rememberMe) === 'true';
      
      if (!accessToken || !userId) {
        return null;
      }
      
      // Get session data from localStorage
      const sessionDataStr = localStorage.getItem(this.cookieNames.sessionData);
      const sessionData = sessionDataStr ? JSON.parse(sessionDataStr) : {};
      
      return {
        accessToken,
        userId,
        rememberMe,
        ...sessionData
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Check if user has a valid session
   * @returns {boolean} True if session exists and is valid
   */
  hasValidSession() {
    const session = this.getSession();
    if (!session) return false;
    
    // Check if session is expired based on last activity
    const lastActivity = session.lastActivity || 0;
    const maxInactivity = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
    
    return (Date.now() - lastActivity) < maxInactivity;
  }

  /**
   * Update session activity timestamp
   * @returns {void}
   */
  updateActivity() {
    try {
      const sessionDataStr = localStorage.getItem(this.cookieNames.sessionData);
      if (sessionDataStr) {
        const sessionData = JSON.parse(sessionDataStr);
        sessionData.lastActivity = Date.now();
        localStorage.setItem(this.cookieNames.sessionData, JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  /**
   * Refresh access token
   * @param {string} newToken - New access token
   * @returns {Promise<void>}
   */
  async refreshToken(newToken) {
    try {
      const session = this.getSession();
      if (!session) {
        throw new Error('No active session to refresh');
      }
      
      // Update access token cookie
      const expiry = session.rememberMe ? 30 : 1;
      Cookies.set(this.cookieNames.accessToken, newToken, {
        ...this.cookieOptions,
        expires: expiry
      });
      
      // Update activity timestamp
      this.updateActivity();
      
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
      // Remove all cookies
      Object.values(this.cookieNames).forEach(cookieName => {
        Cookies.remove(cookieName, { path: '/' });
      });
      
      // Clear localStorage
      localStorage.removeItem(this.cookieNames.sessionData);
      
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
      if (event.key === this.cookieNames.sessionData) {
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
    Object.values(this.cookieNames).forEach(cookieName => {
      Cookies.remove(cookieName, { path: '/' });
    });
    
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
    const maxInactivity = session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const expiresAt = lastActivity + maxInactivity;
    
    return {
      lastActivity: new Date(lastActivity),
      expiresAt: new Date(expiresAt),
      isExpired: Date.now() > expiresAt,
      timeUntilExpiry: Math.max(0, expiresAt - Date.now())
    };
  }

  /**
   * Extend session if remember me is enabled
   * @returns {Promise<void>}
   */
  async extendSession() {
    try {
      const session = this.getSession();
      if (!session || !session.rememberMe) return;
      
      // Update activity and extend cookie expiration
      this.updateActivity();
      
      // Re-set cookies with extended expiration
      const accessToken = Cookies.get(this.cookieNames.accessToken);
      const refreshToken = Cookies.get(this.cookieNames.refreshToken);
      
      if (accessToken && refreshToken) {
        Cookies.set(this.cookieNames.accessToken, accessToken, {
          ...this.cookieOptions,
          expires: 30 // 30 days
        });
        
        Cookies.set(this.cookieNames.refreshToken, refreshToken, {
          ...this.cookieOptions,
          expires: 30 // 30 days
        });
        
        Cookies.set(this.cookieNames.userId, session.userId, {
          ...this.cookieOptions,
          expires: 30 // 30 days
        });
      }
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
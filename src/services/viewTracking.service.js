/**
 * View Tracking Service
 * Handles tracking hotel views via POST /views endpoint
 */

const API_BASE_URL = 'http://localhost:8000';

class ViewTrackingService {
  /**
   * Track a view for a hotel or place
   * @param {string} propertyToken - The property_token (hotel ID) to track
   * @returns {Promise<Object|null>} - View data with total_views and weekly_views, or null on error
   */
  async trackView(propertyToken) {
    if (!propertyToken) {
      console.warn('ViewTrackingService: No property token provided');
      return null;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          target_id: propertyToken,
          target_type: 'hotels'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Return view statistics if available
      if (data && data.data) {
        return {
          totalViews: data.data.total_views || 0,
          weeklyViews: data.data.weekly_views || 0
        };
      }

      return null;
    } catch (error) {
      // Log error but don't throw - tracking failure shouldn't block user interaction
      console.error('View tracking failed:', error.message);
      return null;
    }
  }
}

// Export singleton instance
export const viewTrackingService = new ViewTrackingService();
export default viewTrackingService;

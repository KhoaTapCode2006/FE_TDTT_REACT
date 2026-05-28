import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';

/**
 * NotificationDropdown Component
 * 
 * A modern dropdown menu for displaying and managing notifications
 * Supports invitation accept/decline actions
 * 
 * Firestore notification structure:
 * {
 *   id: string,              // Firebase document ID
 *   actor_id: string,        // User who triggered the notification
 *   receiver_id: string,     // User who received the notification (matches currentUserId)
 *   content: string,         // Fully formatted notification message from backend
 *   type: string,            // 'invitation' or other types
 *   read: boolean,           // Read status
 *   ref_id: string,          // Reference ID (e.g., invitation ID for type='invitation')
 *   send_at: string,         // Firebase timestamp when notification was sent
 *   updated_at: string       // Firebase timestamp when notification was last updated
 * }
 * 
 * @param {Object} props
 * @param {Array} props.notifications - Array of notification objects from Firebase
 * @param {Function} props.onClose - Callback to close the dropdown
 * @param {Function} props.onNotificationUpdate - Callback when notification is updated
 */
export default function NotificationDropdown({ 
  notifications = [], 
  onClose,
  onNotificationUpdate 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processingIds, setProcessingIds] = useState(new Set());
  
  const API_BASE_URL = import.meta.env.VITE_LOCAL_API;
  
  const displayNotifications = notifications;

  /**
   * Generate notification content from backend-provided string
   * The backend now provides fully formatted content strings
   * 
   * @param {Object} notification - Notification object
   * @returns {string} Notification content text
   */
  const generateNotificationContent = (notification) => {
    // Backend provides fully formatted content, use it directly
    return notification.content || 'Bạn có một thông báo mới.';
  };

  /**
   * Check if action buttons should be shown
   * Show Accept/Decline buttons only for unread invitations where user is the receiver
   * Distinguish between actionable invitations and informational receipts using content
   * 
   * @param {Object} notification - Notification object
   * @returns {boolean} Whether to show action buttons
   */
  const shouldShowActions = (notification) => {
    // Must be an invitation type
    if (notification.type !== 'invitation') return false;
    
    // Must be for the current user
    if (notification.receiver_id !== user?.uid) return false;
    
    // Must be unread
    if (notification.read) return false;
    
    // Must be an actionable invitation (not a receipt)
    // Check if content contains "đã mời bạn" to distinguish from receipts like "đã chấp nhận" or "đã từ chối"
    const content = (notification.content || '').toLowerCase();
    if (!content.includes('đã mời bạn')) return false;
    
    return true;
  };

  /**
   * Parse Firebase timestamp to relative time
   * Handles Firestore Timestamp objects, seconds-based timestamps, and string timestamps
   * 
   * @param {Object|string|number} timestamp - Firebase timestamp (Timestamp object, seconds, or string)
   * @param {boolean} isRead - Whether the notification has been read
   * @returns {string} Relative time string (e.g., "2 giờ trước" or "Đã xem 2 giờ trước")
   */
  const parseRelativeTime = (timestamp, isRead = false) => {
    try {
      let date;
      
      // Handle null/undefined
      if (!timestamp) return 'Không xác định';
      
      // Handle Firestore Timestamp object with toDate() method
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle Firestore Timestamp object with seconds property
      else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } 
      // Handle string or number timestamp
      else {
        date = new Date(timestamp);
      }
      
      // Validate the date
      if (isNaN(date.getTime())) return 'Không xác định';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      let relativeTime;
      if (diffInSeconds < 60) {
        relativeTime = 'Vừa xong';
      } else if (diffInSeconds < 3600) {
        relativeTime = `${Math.floor(diffInSeconds / 60)} phút trước`;
      } else if (diffInSeconds < 86400) {
        relativeTime = `${Math.floor(diffInSeconds / 3600)} giờ trước`;
      } else if (diffInSeconds < 604800) {
        relativeTime = `${Math.floor(diffInSeconds / 86400)} ngày trước`;
      } else if (diffInSeconds < 2592000) {
        relativeTime = `${Math.floor(diffInSeconds / 604800)} tuần trước`;
      } else {
        relativeTime = date.toLocaleDateString('vi-VN');
      }
      
      // Add "Đã xem" prefix for read notifications
      return isRead ? `Đã xem ${relativeTime}` : relativeTime;
    } catch (error) {
      console.error('Error parsing timestamp:', error);
      return 'Không xác định';
    }
  };

  /**
   * Get fresh Firebase authentication token
   * @returns {Promise<string>} Auth token
   * @throws {Error} If user is not authenticated or token retrieval fails
   */
  const getAuthToken = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }
      
      // Get fresh token from Firebase
      const token = await auth.currentUser.getIdToken();
      return token;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      throw new Error('Không thể lấy token xác thực. Vui lòng đăng nhập lại.');
    }
  };

  /**
   * Handle notification row click - mark as read and navigate to target entity
   * 
   * @param {Object} notification - Notification object
   */
  const handleNotificationClick = async (notification) => {
    // Prevent action if already processing
    if (processingIds.has(notification.id)) return;
    
    // Only handle invitation type notifications
    if (notification.type !== 'invitation') return;

    try {
      // Mark as read if unread (fire-and-forget)
      if (!notification.read) {
        handleMarkAsRead(notification.id).catch(err => 
          console.error('Failed to mark as read:', err)
        );
      }

      // Fetch invitation details to get the actual entity type and ID
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/invitations/${notification.ref_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invitation: HTTP ${response.status}`);
      }

      // 1. Lấy dữ liệu thô từ API
      const rawResponse = await response.json();
      
      // Đặt console.log ở đây để bạn dễ dàng bắt quả tang API trả về cái gì
      console.log("=== API RESPONSE TRẢ VỀ ===", rawResponse);
      
      // 2. Xử lý thông minh: Lấy lõi .data (nếu có), không có thì lấy chính nó
      const targetData = rawResponse.data ? rawResponse.data : rawResponse;

      // 3. Lúc này targetData chắc chắn là cái ruột bên trong rồi!
      if (!targetData || !targetData.type) {
        console.error("Dữ liệu rỗng hoặc mất trường type!", targetData);
        throw new Error("Lỗi cấu trúc dữ liệu từ server");
      }

      // 4. Bắt đầu chuyển trang bằng targetData
      if (targetData.type === 'collection') {
        navigate(`/collections/${targetData.ref_id}`);
      } else if (targetData.type === 'trip') {
        navigate(`/trips/${targetData.ref_id}`);
      } else {
        // Nếu lọt vào đây, chắc chắn là BE nhả ra một type lạ hoắc
        console.warn("Loại lời mời không được hỗ trợ:", targetData.type);
      }
      
      onClose?.();
    } catch (error) {
      console.error('Failed to handle notification click:', error);
      // Don't show alert for navigation errors - just log them
    }
  };

  /**
   * Handle deleting a notification
   * CRITICAL: Must call e.stopPropagation() first to prevent row click
   * 
   * @param {Event} e - Click event
   * @param {string} notificationId - The ID of the notification to delete
   */
  const handleDeleteNotification = async (e, notificationId) => {
    // CRITICAL: Prevent row click event from firing
    e.stopPropagation();

    // Prevent action if already processing
    if (processingIds.has(notificationId)) return;

    setProcessingIds(prev => new Set(prev).add(notificationId));

    try {
      // Get fresh Firebase token
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users/me/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      console.log('Notification deleted:', notificationId);
      
      // Trigger callback to refresh notifications
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      
      // Show error message
      if (error.message.includes('404')) {
        alert('Thông báo không tồn tại.');
      } else if (error.message.includes('403')) {
        alert('Bạn không có quyền xóa thông báo này.');
      } else if (error.message.includes('đăng nhập')) {
        alert(error.message);
      } else {
        alert('Không thể xóa thông báo. Vui lòng thử lại.');
      }
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  /**
   * Mark notification as read
   * 
   * @param {string} notificationId - The ID of the notification to mark as read
   */
  const handleMarkAsRead = async (notificationId) => {
    if (processingIds.has(notificationId)) return;

    setProcessingIds(prev => new Set(prev).add(notificationId));

    try {
      // Get fresh Firebase token
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users/me/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ read: true })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      console.log('Notification marked as read:', notificationId);
      
      // Trigger callback to refresh notifications
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      
      // Show error message
      if (error.message.includes('404')) {
        alert('Thông báo không tồn tại.');
      } else if (error.message.includes('403')) {
        alert('Bạn không có quyền thực hiện thao tác này.');
      } else if (error.message.includes('đăng nhập')) {
        alert(error.message);
      } else {
        alert('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
      }
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  /**
   * Accept invitation
   * 
   * @param {string} refId - The ref_id (invitation ID) from notification
   * @param {string} notificationId - The notification ID
   */
  const handleAcceptInvite = async (refId, notificationId) => {
    if (processingIds.has(notificationId)) return;

    setProcessingIds(prev => new Set(prev).add(notificationId));

    try {
      // Get fresh Firebase token
      const token = await getAuthToken();

      // Step 1: Accept the invitation
      const response = await fetch(`${API_BASE_URL}/invitations/${refId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      console.log('Invitation accepted:', refId);
      
      // Step 2: Mark notification as read
      await handleMarkAsRead(notificationId);
      
      // Step 3: Show success message
      alert('Đã chấp nhận lời mời thành công!');
      
      // Step 4: Trigger callback to refresh notifications
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      
      // Show error message
      if (error.message.includes('404')) {
        alert('Lời mời không tồn tại hoặc đã hết hạn.');
      } else if (error.message.includes('403')) {
        alert('Bạn không có quyền chấp nhận lời mời này.');
      } else if (error.message.includes('400') || error.message.includes('422')) {
        alert(error.message || 'Lời mời không hợp lệ.');
      } else if (error.message.includes('đăng nhập')) {
        alert(error.message);
      } else {
        alert('Không thể chấp nhận lời mời. Vui lòng thử lại.');
      }
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  /**
   * Reject invitation
   * 
   * @param {string} refId - The ref_id (invitation ID) from notification
   * @param {string} notificationId - The notification ID
   */
  const handleRejectInvite = async (refId, notificationId) => {
    if (processingIds.has(notificationId)) return;

    if (!window.confirm('Bạn có chắc muốn từ chối lời mời này?')) {
      return;
    }

    setProcessingIds(prev => new Set(prev).add(notificationId));

    try {
      // Get fresh Firebase token
      const token = await getAuthToken();

      // Step 1: Decline the invitation (MUST use 'declined', not 'rejected')
      const response = await fetch(`${API_BASE_URL}/invitations/${refId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'declined' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      console.log('Invitation declined:', refId);
      
      // Step 2: Mark notification as read
      await handleMarkAsRead(notificationId);
      
      // Step 3: Show success message
      alert('Đã từ chối lời mời');
      
      // Step 4: Trigger callback to refresh notifications
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Failed to reject invitation:', error);
      
      // Show error message
      if (error.message.includes('404')) {
        alert('Lời mời không tồn tại hoặc đã hết hạn.');
      } else if (error.message.includes('403')) {
        alert('Bạn không có quyền từ chối lời mời này.');
      } else if (error.message.includes('400') || error.message.includes('422')) {
        alert(error.message || 'Lời mời không hợp lệ.');
      } else if (error.message.includes('đăng nhập')) {
        alert(error.message);
      } else {
        alert('Không thể từ chối lời mời. Vui lòng thử lại.');
      }
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  /**
   * Get icon based on notification type
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'invitation':
        return { name: 'collections_bookmark', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'collection':
        return { name: 'collections_bookmark', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'trip':
        return { name: 'flight', color: 'text-purple-600', bg: 'bg-purple-100' };
      default:
        return { name: 'notifications', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const isProcessing = (notificationId) => processingIds.has(notificationId);

  return (
    <div className="bg-white shadow-xl rounded-xl border border-gray-100 w-96 max-w-[calc(100vw-2rem)] overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Thông báo</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Đóng"
          >
            <Icon name="close" size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Icon name="notifications_none" size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Không có thông báo mới</p>
            <p className="text-xs text-gray-400 mt-1">Các thông báo của bạn sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              const isUnread = !notification.read;
              const processing = isProcessing(notification.id);
              const showActions = shouldShowActions(notification);
              const content = generateNotificationContent(notification);
              
              // Conditional timestamp selection based on read status
              const displayTimestamp = isUnread ? notification.send_at : notification.updated_at;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative p-4 transition-colors cursor-pointer ${
                    isUnread ? 'bg-blue-50/50' : 'bg-white'
                  } hover:bg-gray-50 ${processing ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {/* Delete Button - Positioned absolutely in top-right corner */}
                  <button
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    disabled={processing}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    aria-label="Xóa thông báo"
                  >
                    <Icon name="delete_outline" size={18} />
                  </button>

                  <div className="flex gap-3 pr-8">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${icon.bg} flex items-center justify-center`}>
                      <Icon name={icon.name} size={20} className={icon.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Text & Unread Indicator */}
                      <div className="flex items-start gap-2 mb-1">
                        <p className="flex-1 text-sm text-gray-800 leading-relaxed">
                          {content}
                        </p>
                        {isUnread && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <p className="text-xs text-gray-500 mb-2">
                        {parseRelativeTime(displayTimestamp, notification.read)}
                      </p>

                      {/* Invitation Actions - Only show if status is pending and user is not sender */}
                      {showActions && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptInvite(notification.ref_id, notification.id);
                            }}
                            disabled={processing}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {processing ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Đang xử lý...</span>
                              </>
                            ) : (
                              <>
                                <Icon name="check" size={16} />
                                <span>Chấp nhận</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectInvite(notification.ref_id, notification.id);
                            }}
                            disabled={processing}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon name="close" size={16} />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      )}

                      {/* Mark as Read Button (for non-pending or self-sent notifications) */}
                      {!showActions && isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          disabled={processing}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/Icon';
import NotificationDropdown from '@/components/ui/NotificationDropdown';

/**
 * NotificationBell Component
 * 
 * A modern notification bell with Firebase Firestore realtime integration
 * Displays unread count badge and dropdown menu with notifications
 */
export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef(null);
  const { user } = useAuth();

  // Calculate unread count from notifications
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.read).length;
  }, [notifications]);

  // Firebase Firestore realtime listener
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Reference to user's notifications collection
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      
      // Query: order by send_at descending (newest first)
      const q = query(notificationsRef, orderBy('send_at', 'desc'));

      // Set up realtime listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setNotifications(notificationsData);
          setLoading(false);
          
          console.log('Notifications updated:', notificationsData.length);
        },
        (error) => {
          console.error('Error fetching notifications:', error);
          setLoading(false);
        }
      );

      // Cleanup: unsubscribe when component unmounts or user changes
      return () => {
        console.log('Unsubscribing from notifications listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      setLoading(false);
    }
  }, [user?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle notification update (refresh or callback)
  const handleNotificationUpdate = () => {
    // Firestore listener will automatically update the notifications
    // No manual refresh needed
    console.log('Notification updated - Firestore will sync automatically');
  };

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        disabled={loading}
      >
        <Icon name="notifications" size={24} className="text-gray-700" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {/* Loading Indicator */}
        {loading && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <NotificationDropdown
            notifications={notifications}
            onClose={() => setIsOpen(false)}
            onNotificationUpdate={handleNotificationUpdate}
          />
        </div>
      )}
    </div>
  );
}

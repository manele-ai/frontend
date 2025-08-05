import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    console.log('NotificationContext - checking localStorage availability');
    if (typeof window !== 'undefined' && window.localStorage) {
      console.log('localStorage is available');
      const savedNotifications = localStorage.getItem('globalNotifications');
      console.log('Loading notifications from localStorage:', savedNotifications);
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          console.log('Parsed notifications:', parsed);
          // Filter out expired notifications
          const now = Date.now();
          const validNotifications = parsed.filter(notification => {
            if (notification.duration === 'manual') return true;
            return (now - notification.createdAt) < notification.duration;
          });
          console.log('Valid notifications:', validNotifications);
          setNotifications(validNotifications);
        } catch (error) {
          console.error('Error loading notifications from localStorage:', error);
        }
      } else {
        console.log('No saved notifications found in localStorage');
      }
    } else {
      console.log('localStorage is not available');
    }
  }, []);

  const showNotification = useCallback((notification) => {
    console.log('showNotification called with:', notification);
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title || '',
      message: notification.message || '',
      duration: notification.duration || 30000, // Default 30 seconds
      position: notification.position || 'top-right',
      action: notification.action || null,
      requestId: notification.requestId || null,
      createdAt: Date.now(),
      ...notification
    };

    console.log('Created new notification:', newNotification);

    setNotifications(prev => {
      const updated = [...prev, newNotification];
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem('globalNotifications', JSON.stringify(updated));
          console.log('Saved notification to localStorage:', newNotification);
          console.log('All notifications in localStorage:', updated);
          console.log('Current notifications state:', updated);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      } else {
        console.log('localStorage not available for saving');
      }
      return updated;
    });

    // Auto-dismiss if duration is not 'manual'
    if (newNotification.duration !== 'manual' && typeof newNotification.duration === 'number') {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== id);
      // Update localStorage
      localStorage.setItem('globalNotifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('globalNotifications');
  }, []);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 
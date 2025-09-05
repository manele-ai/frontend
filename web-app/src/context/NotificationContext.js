import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext(null);

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
    setNotifications(prev => {
      // Dedupe: avoid adding duplicate 'loading' notifications for the same requestId
      if (
        notification?.type === 'loading' &&
        notification?.requestId &&
        prev.some(n => n.type === 'loading' && n.requestId === notification.requestId)
      ) {
        return prev;
      }

      const newNotifications = [...prev, { ...notification, id: Date.now(), createdAt: Date.now() }];

      // Save to localStorage for persistence
      try {
        localStorage.setItem('globalNotifications', JSON.stringify(newNotifications));
      } catch (error) {
        console.error('Eroare la salvarea notificărilor în localStorage:', error);
      }

      return newNotifications;
    });
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const newNotifications = prev.filter(n => n.id !== id);

      // Update localStorage
      try {
        localStorage.setItem('globalNotifications', JSON.stringify(newNotifications));
      } catch (error) {
        console.error('Eroare la actualizarea notificărilor în localStorage:', error);
      }

      return newNotifications;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);

    // Clear localStorage
    try {
      localStorage.removeItem('globalNotifications');
    } catch (error) {
      console.error('Eroare la ștergerea notificărilor din localStorage:', error);
    }
  }, []);

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 
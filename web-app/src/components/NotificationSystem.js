import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import '../styles/NotificationSystem.css';
import SoundWave from './ui/SoundWave';

const NotificationIcon = ({ type }) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    loading: '⟳'
  };

  return (
    <div className={`notification-icon notification-icon-${type}`}>
      {type === 'loading' ? (
        <SoundWave size="medium" color="#FFF" speed={1.2} bars={6} />
      ) : (
        <span>{icons[type]}</span>
      )}
    </div>
  );
};

const NotificationItem = ({ notification, onRemove }) => {
  const handleAction = () => {
    if (notification.action?.onClick) {
      notification.action.onClick();
    }
    onRemove(notification.id);
  };

  return (
    <div 
      className={`notification-item notification-${notification.type}`}
      style={{ animationDelay: `${notification.createdAt % 1000}ms` }}
    >
      <div className="notification-content">
        <NotificationIcon type={notification.type} />
        
        <div className="notification-text">
          {notification.title && (
            <div className="notification-title">{notification.title}</div>
          )}
          {notification.message && (
            <div className="notification-message">{notification.message}</div>
          )}
        </div>

        <button 
          className="notification-close"
          onClick={() => onRemove(notification.id)}
          aria-label="Închide notificarea"
        >
          ×
        </button>
      </div>

      {notification.action && (
        <div className="notification-action">
          <button 
            className="notification-action-btn"
            onClick={handleAction}
          >
            {notification.action.label}
          </button>
        </div>
      )}

      {notification.duration !== 'manual' && typeof notification.duration === 'number' && (
        <div className="notification-progress">
          <div 
            className="notification-progress-bar"
            style={{
              animationDuration: `${notification.duration}ms`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default function NotificationSystem() {
  const { notifications, removeNotification } = useNotification();

  useEffect(() => {
    // Auto-dismiss notifications with duration
    notifications.forEach(notification => {
      if (notification.duration && notification.duration !== 'manual' && typeof notification.duration === 'number') {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-system">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
} 
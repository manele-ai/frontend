import { useNotification } from '../context/NotificationContext';
import '../styles/NotificationSystem.css';

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
        <span className="loading-spinner">{icons[type]}</span>
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

  console.log('[NOTIF-DEBUG] NotificationSystem: Render cu notificări:', notifications);
  console.log('[NOTIF-DEBUG] NotificationSystem: Numărul de notificări:', notifications.length);

  if (notifications.length === 0) {
    console.log('[NOTIF-DEBUG] NotificationSystem: Nu există notificări, returnez null');
    return null;
  }

  console.log('[NOTIF-DEBUG] NotificationSystem: Afișez notificările:', notifications.map(n => ({ id: n.id, type: n.type, title: n.title })));

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
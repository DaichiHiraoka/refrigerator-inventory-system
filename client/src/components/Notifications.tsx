import { X, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Notification } from "@/types";

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function Notifications({ notifications, onDismiss }: NotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  
  // Auto-dismiss notifications after a timeout
  useEffect(() => {
    setVisibleNotifications(notifications);
    
    const timeouts = notifications.map(notification => {
      return setTimeout(() => {
        onDismiss(notification.id);
      }, 10000); // Auto-dismiss after 10 seconds
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [notifications, onDismiss]);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-secondary text-lg" />;
      case 'warning':
        return <AlertTriangle className="text-warning text-lg" />;
      case 'danger':
        return <AlertCircle className="text-danger text-lg" />;
      default:
        return <AlertCircle className="text-primary text-lg" />;
    }
  };
  
  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-secondary';
      case 'warning':
        return 'border-warning';
      case 'danger':
        return 'border-danger';
      default:
        return 'border-primary';
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 space-y-2 w-72">
      {visibleNotifications.map(notification => (
        <div 
          key={notification.id} 
          className={`bg-white rounded-lg shadow-lg p-3 flex items-start border-l-4 ${getBorderColor(notification.type)} animate-fade-in`}
        >
          <div className="flex-shrink-0 pt-0.5">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">{notification.title}</h3>
            <div className="mt-1 text-xs text-neutral-500">
              {notification.message}
            </div>
          </div>
          <button 
            className="ml-2 flex-shrink-0 text-neutral-400 hover:text-neutral-500"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

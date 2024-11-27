import { useEffect } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

interface Props {
  limit?: number;
  onlyUnread?: boolean;
}

/**
 * Notification Panel Component
 * Displays user notifications with unread indicators
 */
export function NotificationPanel({ limit = 10, onlyUnread = false }: Props) {
  const { state, fetchNotifications, markNotificationRead } = useDashboard();
  const { data, unreadCount, loading, error } = state.notifications;

  useEffect(() => {
    fetchNotifications(onlyUnread);
  }, [onlyUnread, fetchNotifications]);

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        {unreadCount > 0 && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </div>
        )}
        <NotificationList
          notifications={data}
          onMarkRead={markNotificationRead}
        />
      </div>
    </DashboardLoadingState>
  );
}

interface NotificationListProps {
  notifications: Database['public']['Tables']['notifications']['Row'][];
  onMarkRead: (id: string) => Promise<void>;
}

function NotificationList({
  notifications,
  onMarkRead
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No notifications to display
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkRead={onMarkRead}
        />
      ))}
    </ul>
  );
}

interface NotificationItemProps {
  notification: Database['public']['Tables']['notifications']['Row'];
  onMarkRead: (id: string) => Promise<void>;
}

function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const handleMarkRead = async () => {
    if (!notification.read) {
      await onMarkRead(notification.id);
    }
  };

  return (
    <li
      className={`py-4 ${notification.read ? 'opacity-75' : ''}`}
      onClick={handleMarkRead}
      onKeyDown={(e) => e.key === 'Enter' && handleMarkRead()}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <span
            className={`inline-block p-2 rounded-full ${
              notification.read
                ? 'bg-gray-100 text-gray-600'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {getPriorityIcon(notification.priority)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p
              className={`text-sm font-medium ${
                notification.read ? 'text-gray-600' : 'text-gray-900'
              }`}
            >
              {notification.title}
            </p>
            {!notification.read && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {notification.description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
        </div>
      </div>
    </li>
  );
}

// Helper functions
function formatTimeAgo(date: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getPriorityIcon(
  priority: Database['public']['Enums']['notification_priority']
) {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return '⚪';
  }
}

'use client';

import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'match' | 'message' | 'interview' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'match',
      title: 'New Podcast Match',
      message: 'You have a new 95% match with "The Author Hour"',
      timestamp: new Date('2024-01-15T10:00:00'),
      read: false
    },
    {
      id: '2',
      type: 'interview',
      title: 'Interview Confirmed',
      message: 'Your interview with Book Talk Daily is confirmed',
      timestamp: new Date('2024-01-14T15:30:00'),
      read: true
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1 text-zinc-400 hover:text-zinc-200"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg bg-zinc-900 shadow-lg ring-1 ring-zinc-800">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${notification.read ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-zinc-400">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {format(notification.timestamp, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
          {notifications.length === 0 && (
            <div className="p-4 text-center text-sm text-zinc-400">
              No new notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}

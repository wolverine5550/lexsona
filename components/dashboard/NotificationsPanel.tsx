'use client';

import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationsPanelProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
  }>;
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="notifications-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1 text-zinc-400 hover:text-zinc-200"
      >
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
            {notifications.length}
          </span>
        )}
      </button>
      {/* Panel content */}
      {isOpen && (
        <div
          data-testid="notifications-panel"
          className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
        >
          {notifications.map((notification) => (
            <div key={notification.id} className="p-4">
              <h3 className="text-sm font-medium">{notification.title}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

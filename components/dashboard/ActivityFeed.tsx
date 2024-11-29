'use client';

import { useEffect } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

export function ActivityFeed() {
  const { state, actions } = useDashboard();
  const { data, loading, error } = state.activities;

  useEffect(() => {
    actions.fetchActivities();
  }, [actions]);

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        {data.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {data.map((activity) => (
              <li key={activity.id} className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-block p-2 rounded-full bg-blue-50 text-blue-600">
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No activities to display
          </div>
        )}
      </div>
    </DashboardLoadingState>
  );
}

function getActivityIcon(type: Database['public']['Enums']['activity_type']) {
  switch (type) {
    case 'match':
      return '🤝';
    case 'interview':
      return '📅';
    case 'system':
      return '🔔';
    case 'message':
      return '💬';
    case 'review':
      return '⭐';
    default:
      return '📝';
  }
}

function formatTimeAgo(date: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

import { useEffect } from 'react';
import { useDashboard } from '@/contexts/dashboard/DashboardContext';
import { DashboardLoadingState } from './DashboardLoadingState';
import type { Database } from '@/types/database';

interface Props {
  limit?: number;
  grouped?: boolean;
}

/**
 * Activity Feed Component
 * Displays a list of user activities with optional grouping by date
 */
export function ActivityFeed({ limit = 20, grouped = false }: Props) {
  const { state, fetchActivities, fetchGroupedActivities } = useDashboard();
  const { data, groupedData, loading, error } = state.activities;

  // Load activities on mount
  useEffect(() => {
    if (grouped) {
      fetchGroupedActivities(7); // Last 7 days by default
    } else {
      fetchActivities(limit);
    }
  }, [grouped, limit, fetchActivities, fetchGroupedActivities]);

  return (
    <DashboardLoadingState loading={loading} error={error}>
      <div className="space-y-4">
        {grouped ? (
          <GroupedActivities activities={groupedData} />
        ) : (
          <ActivityList activities={data} />
        )}
      </div>
    </DashboardLoadingState>
  );
}

interface ActivityListProps {
  activities: Database['public']['Tables']['activities']['Row'][];
}

function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activities to display
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </ul>
  );
}

interface GroupedActivitiesProps {
  activities: {
    date: string;
    activities: Database['public']['Tables']['activities']['Row'][];
  }[];
}

function GroupedActivities({ activities }: GroupedActivitiesProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activities to display
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activities.map(({ date, activities }) => (
        <section key={date}>
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            {formatDate(date)}
          </h3>
          <ActivityList activities={activities} />
        </section>
      ))}
    </div>
  );
}

interface ActivityItemProps {
  activity: Database['public']['Tables']['activities']['Row'];
}

function ActivityItem({ activity }: ActivityItemProps) {
  const icon = getActivityIcon(activity.type);

  return (
    <li className="py-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <span className="inline-block p-2 rounded-full bg-blue-50 text-blue-600">
            {icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
          <p className="text-sm text-gray-500">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatTimeAgo(activity.created_at)}
          </p>
        </div>
      </div>
    </li>
  );
}

// Helper functions
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function formatTimeAgo(date: string): string {
  // Simple time ago implementation
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getActivityIcon(type: Database['public']['Enums']['activity_type']) {
  // Return appropriate icon based on activity type
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

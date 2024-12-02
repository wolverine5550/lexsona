import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  differenceInSeconds
} from 'date-fns';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import type {
  EngagementData,
  EngagementFilters,
  EngagementMetricsProps,
  ActivityType,
  UserRole
} from './types';

// Color palette for charts
const COLORS = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#16a34a',
  '#14b8a6'
];

/**
 * EngagementMetrics Component
 *
 * Displays comprehensive engagement analytics including:
 * - Activity trends over time
 * - User engagement by role
 * - Feature usage statistics
 * - Session duration analysis
 */
const EngagementMetrics = ({
  initialData,
  onFilterChange,
  isLoading = false,
  error
}: EngagementMetricsProps) => {
  // State for filter values
  const [filters, setFilters] = useState<EngagementFilters>({});

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      // Apply date range filter
      if (filters.startDate && item.timestamp < filters.startDate) return false;
      if (filters.endDate && item.timestamp > filters.endDate) return false;

      // Apply activity type filter
      if (filters.activityType && item.activityType !== filters.activityType) {
        return false;
      }

      // Apply user role filter
      if (filters.userRole && item.userRole !== filters.userRole) {
        return false;
      }

      // Apply section filter
      if (filters.section && item.metadata?.section !== filters.section) {
        return false;
      }

      // Apply feature filter
      if (filters.feature && item.metadata?.feature !== filters.feature) {
        return false;
      }

      return true;
    });
  }, [initialData, filters]);

  // Calculate daily activity trends
  const activityTrends = useMemo(() => {
    const dailyActivity = new Map<string, number>();

    filteredData.forEach((item) => {
      const day = format(parseISO(item.timestamp), 'yyyy-MM-dd');
      dailyActivity.set(day, (dailyActivity.get(day) || 0) + 1);
    });

    return Array.from(dailyActivity.entries()).map(([date, count]) => ({
      date,
      activities: count
    }));
  }, [filteredData]);

  // Calculate user engagement by role
  const roleEngagement = useMemo(() => {
    const roleStats = new Map<UserRole, number>();

    filteredData.forEach((item) => {
      roleStats.set(item.userRole, (roleStats.get(item.userRole) || 0) + 1);
    });

    return Array.from(roleStats.entries()).map(([role, count]) => ({
      role,
      activities: count
    }));
  }, [filteredData]);

  // Calculate feature usage statistics
  const featureUsage = useMemo(() => {
    const featureStats = new Map<ActivityType, number>();

    filteredData.forEach((item) => {
      featureStats.set(
        item.activityType,
        (featureStats.get(item.activityType) || 0) + 1
      );
    });

    return Array.from(featureStats.entries()).map(([feature, count]) => ({
      feature,
      usage: count
    }));
  }, [filteredData]);

  // Calculate average session duration
  const sessionStats = useMemo(() => {
    const sessions = filteredData.filter((item) => item.duration);
    const totalDuration = sessions.reduce(
      (sum, item) => sum + (item.duration || 0),
      0
    );
    const averageDuration =
      sessions.length > 0 ? totalDuration / sessions.length : 0;

    return {
      totalSessions: sessions.length,
      averageDuration: Math.round(averageDuration / 60), // Convert to minutes
      totalDuration: Math.round(totalDuration / 3600) // Convert to hours
    };
  }, [filteredData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof EngagementFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    onFilterChange?.({});
  };

  if (error) {
    return (
      <Card title="Error">
        <div className="text-red-500" role="alert">
          Error: {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card title="Engagement Metrics">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Engagement Metrics</h2>
            <Button
              onClick={handleClearFilters}
              disabled={Object.keys(filters).length === 0}
              variant="slim"
            >
              Clear Filters
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(value: string) =>
                    handleFilterChange('startDate', value)
                  }
                  aria-label="Start date"
                />
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(value: string) =>
                    handleFilterChange('endDate', value)
                  }
                  aria-label="End date"
                />
              </div>
            </div>

            <Select
              value={filters.activityType || ''}
              onValueChange={(value) =>
                handleFilterChange('activityType', value)
              }
            >
              <SelectTrigger aria-label="Select activity type">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Activities</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="profile_view">Profile View</SelectItem>
                <SelectItem value="message_sent">Message Sent</SelectItem>
                <SelectItem value="message_read">Message Read</SelectItem>
                <SelectItem value="resource_access">Resource Access</SelectItem>
                <SelectItem value="feedback_given">Feedback Given</SelectItem>
                <SelectItem value="meeting_scheduled">
                  Meeting Scheduled
                </SelectItem>
                <SelectItem value="meeting_attended">
                  Meeting Attended
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.userRole || ''}
              onValueChange={(value) => handleFilterChange('userRole', value)}
            >
              <SelectTrigger aria-label="Select user role">
                <SelectValue placeholder="User Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="mentee">Mentee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Activity Trends Chart */}
      <Card title="Activity Trends">
        <div className="h-[300px]">
          <ResponsiveContainer>
            <LineChart data={activityTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(parseISO(date), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => format(parseISO(date), 'MMM d, yyyy')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="activities"
                stroke="#2563eb"
                name="Activities"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* User Engagement by Role */}
      <Card title="User Engagement by Role">
        <div className="h-[300px]">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={roleEngagement}
                dataKey="activities"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.role} (${entry.activities})`}
              >
                {roleEngagement.map((entry, index) => (
                  <Cell key={entry.role} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Feature Usage Statistics */}
      <Card title="Feature Usage">
        <div className="h-[300px]">
          <ResponsiveContainer>
            <BarChart data={featureUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="feature" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="usage"
                fill="#2563eb"
                name="Usage Count"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Session Statistics */}
      <Card title="Session Statistics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <dt className="text-sm text-gray-500">Total Sessions</dt>
            <dd className="text-2xl font-semibold">
              {sessionStats.totalSessions}
            </dd>
          </div>
          <div className="text-center">
            <dt className="text-sm text-gray-500">Average Duration</dt>
            <dd className="text-2xl font-semibold">
              {sessionStats.averageDuration} min
            </dd>
          </div>
          <div className="text-center">
            <dt className="text-sm text-gray-500">Total Time</dt>
            <dd className="text-2xl font-semibold">
              {sessionStats.totalDuration} hrs
            </dd>
          </div>
        </div>
      </Card>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          className="fixed inset-0 bg-white/50 flex items-center justify-center"
          role="status"
          aria-label="Loading"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
};

export default EngagementMetrics;

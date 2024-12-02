import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
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
  PerformanceMetric,
  PerformanceFilters,
  PerformanceReportsProps,
  PerformanceMetricCategory,
  TimePeriod,
  UserRole
} from './types';

// Color palette for different metric categories
const CATEGORY_COLORS = {
  response_time: '#2563eb',
  completion_rate: '#16a34a',
  satisfaction_score: '#db2777',
  attendance_rate: '#ea580c',
  feedback_score: '#7c3aed',
  engagement_score: '#14b8a6'
};

// Friendly names for metric categories
const CATEGORY_NAMES = {
  response_time: 'Response Time',
  completion_rate: 'Completion Rate',
  satisfaction_score: 'Satisfaction Score',
  attendance_rate: 'Attendance Rate',
  feedback_score: 'Feedback Score',
  engagement_score: 'Engagement Score'
};

/**
 * PerformanceReports Component
 *
 * Displays comprehensive performance analytics including:
 * - Metric trends over time
 * - Performance comparison by category
 * - Target achievement analysis
 * - Role-based performance breakdown
 */
const PerformanceReports = ({
  initialData,
  onFilterChange,
  isLoading = false,
  error
}: PerformanceReportsProps) => {
  // State for filter values
  const [filters, setFilters] = useState<PerformanceFilters>({
    timePeriod: 'monthly'
  });

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      // Apply date range filter
      if (filters.startDate && item.timestamp < filters.startDate) return false;
      if (filters.endDate && item.timestamp > filters.endDate) return false;

      // Apply category filter
      if (filters.category && item.category !== filters.category) return false;

      // Apply user role filter
      if (filters.userRole && item.userRole !== filters.userRole) return false;

      // Apply target threshold filters
      if (filters.minTarget && item.target && item.target < filters.minTarget) {
        return false;
      }
      if (filters.maxTarget && item.target && item.target > filters.maxTarget) {
        return false;
      }

      return true;
    });
  }, [initialData, filters]);

  // Calculate performance trends
  const performanceTrends = useMemo(() => {
    const trends = new Map<string, Map<PerformanceMetricCategory, number>>();

    filteredData.forEach((item) => {
      const date = format(parseISO(item.timestamp), 'yyyy-MM-dd');
      if (!trends.has(date)) {
        trends.set(date, new Map());
      }
      const dateMetrics = trends.get(date)!;
      dateMetrics.set(
        item.category,
        (dateMetrics.get(item.category) || 0) + item.value
      );
    });

    return Array.from(trends.entries()).map(([date, metrics]) => ({
      date,
      ...Object.fromEntries(metrics.entries())
    }));
  }, [filteredData]);

  // Calculate category averages for radar chart
  const categoryAverages = useMemo(() => {
    const sums = new Map<
      PerformanceMetricCategory,
      { total: number; count: number }
    >();

    filteredData.forEach((item) => {
      if (!sums.has(item.category)) {
        sums.set(item.category, { total: 0, count: 0 });
      }
      const stats = sums.get(item.category)!;
      stats.total += item.value;
      stats.count += 1;
    });

    return Array.from(sums.entries()).map(([category, { total, count }]) => ({
      category: CATEGORY_NAMES[category],
      value: count > 0 ? total / count : 0,
      fullMark: 100
    }));
  }, [filteredData]);

  // Calculate target achievement rates
  const targetAchievement = useMemo(() => {
    const achievements = new Map<
      PerformanceMetricCategory,
      {
        achieved: number;
        total: number;
      }
    >();

    filteredData.forEach((item) => {
      if (item.target) {
        if (!achievements.has(item.category)) {
          achievements.set(item.category, { achieved: 0, total: 0 });
        }
        const stats = achievements.get(item.category)!;
        stats.total += 1;
        if (item.value >= item.target) {
          stats.achieved += 1;
        }
      }
    });

    return Array.from(achievements.entries()).map(([category, stats]) => ({
      category: CATEGORY_NAMES[category],
      achievementRate:
        stats.total > 0 ? (stats.achieved / stats.total) * 100 : 0
    }));
  }, [filteredData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PerformanceFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({ timePeriod: 'monthly' });
    onFilterChange?.({ timePeriod: 'monthly' });
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
      <Card title="Performance Reports">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Performance Reports</h2>
            <Button
              onClick={handleClearFilters}
              disabled={Object.keys(filters).length === 1}
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
              value={filters.category || ''}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger aria-label="Select metric category">
                <SelectValue placeholder="Metric Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {Object.entries(CATEGORY_NAMES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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

            <Select
              value={filters.timePeriod}
              onValueChange={(value) => handleFilterChange('timePeriod', value)}
            >
              <SelectTrigger aria-label="Select time period">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Performance Trends */}
      <Card title="Performance Trends">
        <div className="h-[400px]">
          <ResponsiveContainer>
            <LineChart data={performanceTrends}>
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
              {Object.entries(CATEGORY_NAMES).map(([category, label]) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  name={label}
                  stroke={
                    CATEGORY_COLORS[category as PerformanceMetricCategory]
                  }
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category Performance Overview */}
      <Card title="Category Performance Overview">
        <div className="h-[400px]">
          <ResponsiveContainer>
            <RadarChart data={categoryAverages}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Target Achievement */}
      <Card title="Target Achievement Rates">
        <div className="h-[400px]">
          <ResponsiveContainer>
            <BarChart data={targetAchievement}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <ReferenceLine y={80} stroke="#16a34a" strokeDasharray="3 3" />
              <Bar
                dataKey="achievementRate"
                fill="#2563eb"
                name="Achievement Rate (%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
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

export default PerformanceReports;

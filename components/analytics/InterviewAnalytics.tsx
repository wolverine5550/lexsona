import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { format, parseISO, differenceInMinutes } from 'date-fns';
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
  InterviewData,
  InterviewFilters,
  InterviewAnalyticsProps,
  InterviewFormat
} from './types';

/**
 * InterviewAnalytics Component
 *
 * Displays comprehensive analytics for interviews including completion rates,
 * duration analysis, and feedback scores.
 */
const InterviewAnalytics = ({
  initialData,
  onFilterChange,
  isLoading = false,
  error
}: InterviewAnalyticsProps) => {
  // State for filter values
  const [filters, setFilters] = useState<InterviewFilters>({});

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      // Apply date range filter
      if (filters.startDate && item.scheduledAt < filters.startDate)
        return false;
      if (filters.endDate && item.scheduledAt > filters.endDate) return false;

      // Apply status filter
      if (filters.status && item.status !== filters.status) return false;

      // Apply format filter
      if (filters.format && item.metadata?.format !== filters.format) {
        return false;
      }

      // Apply role filter
      if (
        filters.interviewerRole &&
        item.metadata?.interviewerRole !== filters.interviewerRole
      ) {
        return false;
      }

      // Apply level filter
      if (
        filters.candidateLevel &&
        item.metadata?.candidateLevel !== filters.candidateLevel
      ) {
        return false;
      }

      // Apply position filter
      if (filters.position && item.metadata?.position !== filters.position) {
        return false;
      }

      return true;
    });
  }, [initialData, filters]);

  // Calculate completion rate data
  const completionData = useMemo(() => {
    const total = filteredData.length;
    const completed = filteredData.filter(
      (item) => item.status === 'completed'
    ).length;
    const cancelled = filteredData.filter(
      (item) => item.status === 'cancelled'
    ).length;
    const noShow = filteredData.filter(
      (item) => item.status === 'no_show'
    ).length;

    return [
      {
        name: 'Completed',
        value: (completed / total) * 100,
        count: completed
      },
      {
        name: 'Cancelled',
        value: (cancelled / total) * 100,
        count: cancelled
      },
      {
        name: 'No Show',
        value: (noShow / total) * 100,
        count: noShow
      }
    ];
  }, [filteredData]);

  // Calculate duration statistics
  const durationStats = useMemo(() => {
    const completedInterviews = filteredData.filter(
      (item) => item.status === 'completed' && item.startedAt && item.endedAt
    );

    const durations = completedInterviews.map((item) =>
      differenceInMinutes(parseISO(item.endedAt!), parseISO(item.startedAt!))
    );

    const average =
      durations.length > 0
        ? durations.reduce((sum, duration) => sum + duration, 0) /
          durations.length
        : 0;

    return {
      average,
      min: Math.min(...durations, 0),
      max: Math.max(...durations, 0),
      total: completedInterviews.length
    };
  }, [filteredData]);

  // Calculate feedback scores
  const feedbackScores = useMemo(() => {
    const interviewsWithFeedback = filteredData.filter(
      (item) => item.feedback && item.status === 'completed'
    );

    if (interviewsWithFeedback.length === 0) {
      return [];
    }

    const scores = {
      satisfaction: 0,
      technical: 0,
      communication: 0,
      culturalFit: 0
    };

    interviewsWithFeedback.forEach((item) => {
      if (item.feedback) {
        scores.satisfaction += item.feedback.satisfaction;
        scores.technical += item.feedback.technical;
        scores.communication += item.feedback.communication;
        scores.culturalFit += item.feedback.culturalFit;
      }
    });

    const total = interviewsWithFeedback.length;
    return [
      {
        category: 'Satisfaction',
        score: scores.satisfaction / total
      },
      {
        category: 'Technical',
        score: scores.technical / total
      },
      {
        category: 'Communication',
        score: scores.communication / total
      },
      {
        category: 'Cultural Fit',
        score: scores.culturalFit / total
      }
    ];
  }, [filteredData]);

  // Handle filter changes
  const handleFilterChange = (key: keyof InterviewFilters, value: string) => {
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
      <Card title="Interview Analytics">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Interview Analytics</h2>
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
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger aria-label="Select status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.format || ''}
              onValueChange={(value) => handleFilterChange('format', value)}
            >
              <SelectTrigger aria-label="Select format">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Formats</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="cultural_fit">Cultural Fit</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Completion Rate Chart */}
      <Card title="Completion Rates">
        <div className="h-[300px]">
          <ResponsiveContainer>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
              <Legend />
              <Bar
                dataKey="value"
                fill="#2563eb"
                name="Percentage"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Duration Analysis */}
      <Card title="Duration Analysis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Statistics</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Average Duration</dt>
                <dd className="text-2xl font-semibold">
                  {Math.round(durationStats.average)} min
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Total Interviews</dt>
                <dd className="text-2xl font-semibold">
                  {durationStats.total}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Shortest</dt>
                <dd className="text-2xl font-semibold">
                  {durationStats.min} min
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Longest</dt>
                <dd className="text-2xl font-semibold">
                  {durationStats.max} min
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      {/* Feedback Scores */}
      <Card title="Feedback Scores">
        <div className="h-[400px]">
          <ResponsiveContainer>
            <RadarChart data={feedbackScores}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis domain={[0, 5]} />
              <Radar
                name="Average Score"
                dataKey="score"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.6}
              />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2), 'Score']}
              />
              <Legend />
            </RadarChart>
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

export default InterviewAnalytics;

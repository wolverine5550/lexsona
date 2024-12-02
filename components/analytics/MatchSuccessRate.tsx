import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
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
  MatchSuccessData,
  MatchSuccessFilters,
  MatchSuccessRateProps
} from './types';

/**
 * MatchSuccessRate Component
 *
 * Displays a line chart showing match success rates over time with filtering capabilities.
 * Uses Recharts for visualization and includes interactive filters for data analysis.
 */
const MatchSuccessRate = ({
  initialData,
  onFilterChange,
  isLoading = false,
  error
}: MatchSuccessRateProps) => {
  // State for filter values
  const [filters, setFilters] = useState<MatchSuccessFilters>({});

  // Memoized filtered data
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      // Apply date range filter
      if (filters.startDate && item.date < filters.startDate) return false;
      if (filters.endDate && item.date > filters.endDate) return false;

      // Apply metadata filters
      if (
        filters.mentorField &&
        item.metadata?.mentorField !== filters.mentorField
      ) {
        return false;
      }
      if (
        filters.menteeField &&
        item.metadata?.menteeField !== filters.menteeField
      ) {
        return false;
      }
      if (
        filters.mentorExperience &&
        item.metadata?.mentorExperience !== filters.mentorExperience
      ) {
        return false;
      }
      if (
        filters.menteeCareerStage &&
        item.metadata?.menteeCareerStage !== filters.menteeCareerStage
      ) {
        return false;
      }

      return true;
    });
  }, [initialData, filters]);

  // Calculate overall success rate
  const overallSuccessRate = useMemo(() => {
    const totalSuccessful = filteredData.reduce(
      (sum, item) => sum + item.successfulMatches,
      0
    );
    const totalAttempts = filteredData.reduce(
      (sum, item) => sum + item.totalAttempts,
      0
    );
    return totalAttempts > 0
      ? ((totalSuccessful / totalAttempts) * 100).toFixed(1)
      : '0';
  }, [filteredData]);

  // Handle filter changes
  const handleFilterChange = (
    key: keyof MatchSuccessFilters,
    value: string
  ) => {
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
    <Card title="Match Success Rate">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Match Success Rate</h2>
          <p className="text-gray-500">
            Overall Success Rate: {overallSuccessRate}%
          </p>
        </div>
        <Button
          onClick={handleClearFilters}
          disabled={Object.keys(filters).length === 0}
          variant="slim"
        >
          Clear Filters
        </Button>
      </div>

      {/* Filters Section */}
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
              onChange={(value: string) => handleFilterChange('endDate', value)}
              aria-label="End date"
            />
          </div>
        </div>

        <Select
          value={filters.mentorField || ''}
          onValueChange={(value: string) =>
            handleFilterChange('mentorField', value)
          }
        >
          <SelectTrigger aria-label="Select mentor field">
            <SelectValue placeholder="Mentor Field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Fields</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.menteeField || ''}
          onValueChange={(value: string) =>
            handleFilterChange('menteeField', value)
          }
        >
          <SelectTrigger aria-label="Select mentee field">
            <SelectValue placeholder="Mentee Field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Fields</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chart Section */}
      <div className="h-[400px] w-full">
        <ResponsiveContainer>
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM d')}
            />
            <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Success Rate']}
              labelFormatter={(date) => format(parseISO(date), 'MMM d, yyyy')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#2563eb"
              name="Success Rate"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-white/50 flex items-center justify-center"
          role="status"
          aria-label="Loading"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
    </Card>
  );
};

export default MatchSuccessRate;

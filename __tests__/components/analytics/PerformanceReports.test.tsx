import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import PerformanceReports from '@/components/analytics/PerformanceReports';
import {
  PerformanceMetric,
  PerformanceMetricCategory,
  UserRole,
  TimePeriod
} from '@/components/analytics/types';

// Mock data
const mockPerformanceData: PerformanceMetric[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:00:00Z',
    category: 'response_time' as PerformanceMetricCategory,
    value: 85,
    target: 90,
    userId: 'user1',
    userRole: 'mentor' as UserRole,
    metadata: {
      source: 'system',
      tags: ['response', 'communication'],
      notes: 'Above average response time'
    }
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:00:00Z',
    category: 'satisfaction_score' as PerformanceMetricCategory,
    value: 92,
    target: 85,
    userId: 'user2',
    userRole: 'mentee' as UserRole,
    metadata: {
      source: 'feedback',
      tags: ['satisfaction', 'quality'],
      notes: 'High satisfaction rating'
    }
  }
];

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ children }: any) => <div data-testid="line">{children}</div>,
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ children }: any) => <div data-testid="bar">{children}</div>,
  RadarChart: ({ children }: any) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: ({ children }: any) => <div data-testid="radar">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />
}));

// Mock Select component
vi.mock('@/components/ui/Select', () => {
  const Select = ({ onValueChange, children }: any) => {
    // Extract aria-label from SelectTrigger child
    const triggerChild = Array.isArray(children)
      ? children.find((child: any) => child.type.name === 'SelectTrigger')
      : children;
    const ariaLabel = triggerChild?.props?.['aria-label'];

    return (
      <select
        data-testid={`select-${ariaLabel?.toLowerCase().replace(/\s+/g, '-')}`}
        onChange={(e) => onValueChange?.(e.target.value)}
        aria-label={ariaLabel}
      >
        <option value="">Select...</option>
        <option value="response_time">Response Time</option>
        <option value="mentor">Mentor</option>
        <option value="weekly">Weekly</option>
      </select>
    );
  };

  return {
    Select,
    SelectContent: ({ children }: any) => null,
    SelectItem: ({ children }: any) => null,
    SelectTrigger: ({ children, 'aria-label': ariaLabel }: any) => null,
    SelectValue: ({ placeholder }: any) => null
  };
});

describe('PerformanceReports', () => {
  // Component Rendering
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<PerformanceReports initialData={mockPerformanceData} />);
      expect(
        screen.getByRole('heading', {
          name: 'Performance Reports',
          level: 3
        })
      ).toBeInTheDocument();
    });

    it('should display all chart sections', () => {
      render(<PerformanceReports initialData={mockPerformanceData} />);
      expect(screen.getByText('Performance Trends')).toBeInTheDocument();
      expect(
        screen.getByText('Category Performance Overview')
      ).toBeInTheDocument();
      expect(screen.getByText('Target Achievement Rates')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      render(<PerformanceReports initialData={[]} isLoading={true} />);
      expect(
        screen.getByRole('status', { name: 'Loading' })
      ).toBeInTheDocument();
    });

    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to load data';
      render(
        <PerformanceReports
          initialData={[]}
          error={errorMessage}
          isLoading={false}
        />
      );
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(`Error: ${errorMessage}`);
    });
  });

  // Filtering
  describe('Filtering', () => {
    it('should handle date range filtering', () => {
      const onFilterChange = vi.fn();
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          onFilterChange={onFilterChange}
        />
      );

      const startDateInput = screen.getByLabelText('Start date');
      const endDateInput = screen.getByLabelText('End date');

      fireEvent.change(startDateInput, {
        target: { value: '2024-01-01' }
      });
      fireEvent.change(endDateInput, {
        target: { value: '2024-01-31' }
      });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        })
      );
    });

    it('should handle metric category filtering', async () => {
      const onFilterChange = vi.fn();
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          onFilterChange={onFilterChange}
        />
      );

      // Find the metric category select
      const categorySelect = screen.getByTestId(
        'select-select-metric-category'
      );

      // Clear any previous calls
      onFilterChange.mockClear();

      // Change to response time category
      fireEvent.change(categorySelect, { target: { value: 'response_time' } });

      // Verify the callback was called with the correct filter
      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'response_time'
          })
        );
      });
    });

    it('should handle user role filtering', async () => {
      const onFilterChange = vi.fn();
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          onFilterChange={onFilterChange}
        />
      );

      // Find the user role select
      const userRoleSelect = screen.getByTestId('select-select-user-role');

      // Clear any previous calls
      onFilterChange.mockClear();

      // Change to mentor role
      fireEvent.change(userRoleSelect, { target: { value: 'mentor' } });

      // Verify the callback was called with the correct filter
      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            userRole: 'mentor'
          })
        );
      });
    });

    it('should handle time period filtering', async () => {
      const onFilterChange = vi.fn();
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          onFilterChange={onFilterChange}
        />
      );

      // Find the time period select
      const periodSelect = screen.getByTestId('select-select-time-period');

      // Clear any previous calls
      onFilterChange.mockClear();

      // Change to weekly period
      fireEvent.change(periodSelect, { target: { value: 'weekly' } });

      // Verify the callback was called with the correct filter
      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({
          timePeriod: 'weekly'
        });
      });
    });

    it('should clear all filters except time period', async () => {
      const onFilterChange = vi.fn();
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          onFilterChange={onFilterChange}
        />
      );

      // Get all select elements
      const categorySelect = screen.getByTestId(
        'select-select-metric-category'
      );
      const roleSelect = screen.getByTestId('select-select-user-role');
      const periodSelect = screen.getByTestId('select-select-time-period');

      // Set initial filters
      fireEvent.change(categorySelect, { target: { value: 'response_time' } });
      fireEvent.change(roleSelect, { target: { value: 'mentor' } });
      fireEvent.change(periodSelect, { target: { value: 'monthly' } });

      // Wait for all filters to be applied
      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'response_time',
            userRole: 'mentor',
            timePeriod: 'monthly'
          })
        );
      });

      // Clear the mock to only test the clear filters action
      onFilterChange.mockClear();

      // Find and click the clear button
      const clearButton = screen.getByRole('button', {
        name: /clear filters/i
      });
      fireEvent.click(clearButton);

      // Verify that onFilterChange was called with all filters cleared except timePeriod
      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith({
          timePeriod: 'monthly'
        });
      });
    });
  });

  // Data Visualization
  describe('Data Visualization', () => {
    it('should render all chart components with data', () => {
      render(<PerformanceReports initialData={mockPerformanceData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle empty data gracefully', () => {
      render(<PerformanceReports initialData={[]} />);

      // Check that charts are rendered but empty
      const lineChart = screen.getByTestId('line-chart');
      const radarChart = screen.getByTestId('radar-chart');
      const barChart = screen.getByTestId('bar-chart');

      expect(lineChart).toBeInTheDocument();
      expect(radarChart).toBeInTheDocument();
      expect(barChart).toBeInTheDocument();

      // Verify that the charts are rendered within their containers
      expect(
        lineChart.closest('[data-testid="responsive-container"]')
      ).toBeInTheDocument();
      expect(
        radarChart.closest('[data-testid="responsive-container"]')
      ).toBeInTheDocument();
      expect(
        barChart.closest('[data-testid="responsive-container"]')
      ).toBeInTheDocument();
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('should have accessible filter controls', () => {
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          onFilterChange={vi.fn()}
        />
      );

      // Check date inputs
      expect(screen.getByLabelText('Start date')).toBeInTheDocument();
      expect(screen.getByLabelText('End date')).toBeInTheDocument();

      // Check selects
      expect(
        screen.getByRole('combobox', { name: 'Select metric category' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: 'Select user role' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: 'Select time period' })
      ).toBeInTheDocument();

      // Verify they're keyboard accessible
      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        expect(select).toHaveAttribute('aria-label');
      });
    });

    it('should have accessible loading state', () => {
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          isLoading={true}
        />
      );
      const loadingElement = screen.getByRole('status', { name: 'Loading' });
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading');
    });

    it('should have accessible error state', () => {
      const errorMessage = 'Failed to load data';
      render(
        <PerformanceReports
          initialData={mockPerformanceData}
          error={errorMessage}
        />
      );
      expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    });
  });
});

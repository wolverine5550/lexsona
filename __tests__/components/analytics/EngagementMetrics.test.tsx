import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import EngagementMetrics from '@/components/analytics/EngagementMetrics';
import {
  EngagementData,
  ActivityType,
  UserRole
} from '@/components/analytics/types';

// Mock data
const mockEngagementData: EngagementData[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:00:00Z',
    activityType: 'login' as ActivityType,
    userRole: 'mentor' as UserRole,
    userId: 'user1',
    duration: 300,
    metadata: {
      section: 'web',
      properties: {
        browser: 'Chrome',
        platform: 'desktop'
      }
    }
  },
  {
    id: '2',
    timestamp: '2024-01-15T14:00:00Z',
    activityType: 'message_sent' as ActivityType,
    userRole: 'mentee' as UserRole,
    userId: 'user2',
    duration: 600,
    metadata: {
      section: 'mobile',
      properties: {
        browser: 'Safari',
        platform: 'mobile'
      }
    }
  }
];

// Mock Select component
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
    'aria-label': ariaLabel
  }: any) => {
    // Find the SelectTrigger child to get its aria-label
    const triggerChild = Array.isArray(children)
      ? children.find((child: any) => child.type.name === 'SelectTrigger')
      : children;
    const triggerAriaLabel = triggerChild?.props?.['aria-label'];

    // Convert aria-label to test ID
    const testId = `select-${triggerAriaLabel?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid={testId}
        aria-label={triggerAriaLabel}
      >
        {Array.isArray(children)
          ? children.find((child: any) => child.type.name === 'SelectContent')
              ?.props?.children
          : children}
      </select>
    );
  },
  SelectTrigger: ({ children, 'aria-label': ariaLabel }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  )
}));

describe('EngagementMetrics', () => {
  // Component Rendering
  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<EngagementMetrics initialData={mockEngagementData} />);
      expect(
        screen.getByRole('heading', { level: 3, name: 'Engagement Metrics' })
      ).toBeInTheDocument();
    });

    it('should display all chart sections', () => {
      render(<EngagementMetrics initialData={mockEngagementData} />);
      expect(screen.getByText('Activity Trends')).toBeInTheDocument();
      expect(screen.getByText('User Engagement by Role')).toBeInTheDocument();
      expect(screen.getByText('Feature Usage')).toBeInTheDocument();
      expect(screen.getByText('Session Statistics')).toBeInTheDocument();
    });

    it('should show loading state when isLoading is true', () => {
      render(<EngagementMetrics initialData={mockEngagementData} isLoading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to load data';
      render(
        <EngagementMetrics
          initialData={mockEngagementData}
          error={errorMessage}
        />
      );
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(errorMessage);
    });
  });

  // Filtering
  describe('Filtering', () => {
    it('should handle date range filter changes', () => {
      const onFilterChange = vi.fn();
      render(
        <EngagementMetrics
          initialData={mockEngagementData}
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

    it('should handle activity type filter changes', () => {
      const onFilterChange = vi.fn();
      render(
        <EngagementMetrics
          initialData={mockEngagementData}
          onFilterChange={onFilterChange}
        />
      );

      const activitySelect = screen.getByTestId('select-select-activity-type');
      fireEvent.change(activitySelect, { target: { value: 'login' } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'login'
        })
      );
    });

    it('should handle user role filter changes', () => {
      const onFilterChange = vi.fn();
      render(
        <EngagementMetrics
          initialData={mockEngagementData}
          onFilterChange={onFilterChange}
        />
      );

      const roleSelect = screen.getByTestId('select-select-user-role');
      fireEvent.change(roleSelect, { target: { value: 'mentor' } });

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userRole: 'mentor'
        })
      );
    });

    it('should clear all filters', () => {
      const onFilterChange = vi.fn();
      render(
        <EngagementMetrics
          initialData={mockEngagementData}
          onFilterChange={onFilterChange}
        />
      );

      // Set a filter first
      const roleSelect = screen.getByTestId('select-select-user-role');
      fireEvent.change(roleSelect, { target: { value: 'mentor' } });

      // Wait for the filter to be applied
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          userRole: 'mentor'
        })
      );

      // Clear the mock calls from setting the filter
      onFilterChange.mockClear();

      // Now clear the filters
      const clearButton = screen.getByRole('button', { name: 'Clear Filters' });
      expect(clearButton).not.toBeDisabled();
      fireEvent.click(clearButton);

      expect(onFilterChange).toHaveBeenCalledWith({});
    });
  });

  // Data Calculations
  describe('Data Calculations', () => {
    it('should calculate session statistics correctly', () => {
      render(<EngagementMetrics initialData={mockEngagementData} />);

      // Find the Average Duration section and check its value
      const averageDurationSection =
        screen.getByText('Average Duration').parentElement;
      expect(averageDurationSection).toHaveTextContent('8 min');

      // Find the Total Sessions section and check its value
      const totalSessionsSection =
        screen.getByText('Total Sessions').parentElement;
      expect(totalSessionsSection).toHaveTextContent('2');

      // Find the Total Time section and check its value
      const totalTimeSection = screen.getByText('Total Time').parentElement;
      expect(totalTimeSection).toHaveTextContent('0 hrs');
    });

    it('should handle empty data gracefully', () => {
      render(<EngagementMetrics initialData={[]} />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Total Sessions
      expect(screen.getByText('0 min')).toBeInTheDocument(); // Average Duration
      expect(screen.getByText('0 hrs')).toBeInTheDocument(); // Total Time
    });
  });

  // Chart Rendering
  describe('Chart Rendering', () => {
    it('should render all chart components', () => {
      render(<EngagementMetrics initialData={mockEngagementData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  // Accessibility
  describe('Accessibility', () => {
    it('should have accessible filter controls', () => {
      render(<EngagementMetrics initialData={mockEngagementData} />);

      expect(screen.getByLabelText('Start date')).toBeInTheDocument();
      expect(screen.getByLabelText('End date')).toBeInTheDocument();
      expect(screen.getByLabelText('Select activity type')).toBeInTheDocument();
      expect(screen.getByLabelText('Select user role')).toBeInTheDocument();
    });

    it('should have accessible loading state', () => {
      render(<EngagementMetrics initialData={mockEngagementData} isLoading />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Loading'
      );
    });

    it('should have accessible error state', () => {
      const errorMessage = 'Failed to load data';
      render(
        <EngagementMetrics
          initialData={mockEngagementData}
          error={errorMessage}
        />
      );
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveTextContent(errorMessage);
    });
  });
});

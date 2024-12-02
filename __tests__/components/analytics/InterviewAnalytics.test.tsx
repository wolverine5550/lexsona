import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import InterviewAnalytics from '@/components/analytics/InterviewAnalytics';
import { InterviewData } from '@/components/analytics/types';

// Mock data
const mockInterviewData: InterviewData[] = [
  {
    id: '1',
    scheduledAt: '2024-01-15T10:00:00Z',
    startedAt: '2024-01-15T10:00:00Z',
    endedAt: '2024-01-15T11:00:00Z',
    duration: 60,
    status: 'completed',
    metadata: {
      format: 'technical',
      interviewerRole: 'senior',
      candidateLevel: 'mid',
      position: 'software-engineer'
    },
    feedback: {
      technical: 4,
      communication: 4.5,
      satisfaction: 4,
      culturalFit: 4.5
    }
  },
  {
    id: '2',
    scheduledAt: '2024-01-15T14:00:00Z',
    startedAt: '2024-01-15T14:00:00Z',
    endedAt: '2024-01-15T15:00:00Z',
    duration: 60,
    status: 'completed',
    metadata: {
      format: 'behavioral',
      interviewerRole: 'lead',
      candidateLevel: 'senior',
      position: 'tech-lead'
    },
    feedback: {
      technical: 3.5,
      communication: 5,
      satisfaction: 4.5,
      culturalFit: 4.5
    }
  }
];

// Mock Select component
vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => (
    <option value={value || 'all'}>{children}</option>
  )
}));

// Mock Recharts components
vi.mock('recharts', () => {
  const React = require('react');
  const createMockComponent = (testId: string) => {
    const Component = ({ children, data, ...props }: any) => {
      return React.createElement(
        'div',
        {
          'data-testid': testId,
          'data-chart-data': data ? JSON.stringify(data) : undefined,
          ...props
        },
        children
      );
    };
    Component.displayName = testId;
    return Component;
  };

  return {
    ResponsiveContainer: ({ children }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'responsive-container' },
        children
      ),
    LineChart: createMockComponent('line-chart'),
    Line: createMockComponent('line'),
    BarChart: createMockComponent('bar-chart'),
    Bar: createMockComponent('bar'),
    RadarChart: createMockComponent('radar-chart'),
    Radar: createMockComponent('radar'),
    PieChart: createMockComponent('pie-chart'),
    Pie: createMockComponent('pie'),
    Cell: createMockComponent('cell'),
    PolarGrid: createMockComponent('polar-grid'),
    PolarAngleAxis: createMockComponent('polar-angle-axis'),
    PolarRadiusAxis: createMockComponent('polar-radius-axis'),
    XAxis: createMockComponent('x-axis'),
    YAxis: createMockComponent('y-axis'),
    CartesianGrid: createMockComponent('cartesian-grid'),
    Tooltip: createMockComponent('tooltip'),
    Legend: createMockComponent('legend')
  };
});

describe('InterviewAnalytics Component', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with initial data', () => {
      render(<InterviewAnalytics initialData={mockInterviewData} />);
      expect(
        screen.getByRole('heading', { level: 2, name: 'Interview Analytics' })
      ).toBeInTheDocument();
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should display loading state', () => {
      render(<InterviewAnalytics initialData={mockInterviewData} isLoading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should handle date range filter changes', async () => {
      render(
        <InterviewAnalytics
          initialData={mockInterviewData}
          onFilterChange={mockOnFilterChange}
        />
      );

      const startDateInput = screen.getByLabelText('Start date');
      const endDateInput = screen.getByLabelText('End date');

      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          })
        );
      });
    });

    it('should handle status filter changes', async () => {
      render(
        <InterviewAnalytics
          initialData={mockInterviewData}
          onFilterChange={mockOnFilterChange}
        />
      );

      const statusSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(statusSelect, { target: { value: 'completed' } });

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'completed'
          })
        );
      });
    });

    it('should handle format filter changes', async () => {
      render(
        <InterviewAnalytics
          initialData={mockInterviewData}
          onFilterChange={mockOnFilterChange}
        />
      );

      const formatSelect = screen.getAllByTestId('select')[1];
      fireEvent.change(formatSelect, { target: { value: 'technical' } });

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'technical'
          })
        );
      });
    });

    it('should clear all filters', async () => {
      render(
        <InterviewAnalytics
          initialData={mockInterviewData}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Set a filter first
      const statusSelect = screen.getAllByTestId('select')[0];
      fireEvent.change(statusSelect, { target: { value: 'completed' } });

      // Clear the mock calls from setting the filter
      mockOnFilterChange.mockClear();

      // Now clear the filters
      const clearButton = screen.getByRole('button', { name: 'Clear Filters' });
      expect(clearButton).not.toBeDisabled();
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Data Calculations', () => {
    it('should calculate completion rates correctly', async () => {
      const { container } = render(
        <InterviewAnalytics initialData={mockInterviewData} />
      );

      // First ensure the chart container is rendered
      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="responsive-container"]')
        ).toBeInTheDocument();
      });

      // Then check for the bar chart and its data
      await waitFor(() => {
        const chart = container.querySelector('[data-testid="bar-chart"]');
        expect(chart).toBeInTheDocument();
        const dataAttr = chart?.getAttribute('data-chart-data');
        expect(dataAttr).toBeTruthy();
        const data = JSON.parse(dataAttr || '[]');
        expect(data).toContainEqual(
          expect.objectContaining({
            name: 'Completed',
            value: 100,
            count: 2
          })
        );
      });
    });

    it('should calculate duration statistics correctly', () => {
      render(<InterviewAnalytics initialData={mockInterviewData} />);

      // Find the Average Duration label first
      const averageDurationLabel = screen.getByText('Average Duration');
      // Then find the value in its parent's next sibling
      const averageDurationValue = averageDurationLabel
        .closest('div')
        ?.querySelector('dd');
      expect(averageDurationValue).toHaveTextContent('60 min');

      expect(screen.getByText('2')).toBeInTheDocument(); // Total interviews
    });

    it('should calculate feedback scores correctly', async () => {
      const { container } = render(
        <InterviewAnalytics initialData={mockInterviewData} />
      );

      // First ensure the chart container is rendered
      await waitFor(() => {
        expect(
          container.querySelector('[data-testid="responsive-container"]')
        ).toBeInTheDocument();
      });

      // Then check for the radar chart and its data
      await waitFor(() => {
        const chart = container.querySelector('[data-testid="radar-chart"]');
        expect(chart).toBeInTheDocument();
        const dataAttr = chart?.getAttribute('data-chart-data');
        expect(dataAttr).toBeTruthy();
        const data = JSON.parse(dataAttr || '[]');
        expect(data).toContainEqual(
          expect.objectContaining({
            category: 'Technical',
            score: 3.75
          })
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      render(<InterviewAnalytics initialData={[]} />);

      // Check average duration specifically
      const averageDurationLabel = screen.getByText('Average Duration');
      expect(averageDurationLabel.nextElementSibling).toHaveTextContent(
        '0 min'
      );

      // Check total interviews
      const totalInterviewsLabel = screen.getByText('Total Interviews');
      expect(totalInterviewsLabel.nextElementSibling).toHaveTextContent('0');
    });

    it('should handle missing feedback data', () => {
      const dataWithMissingFeedback: InterviewData[] = [
        {
          id: '1',
          scheduledAt: '2024-01-15T10:00:00Z',
          status: 'completed',
          metadata: {
            format: 'technical',
            interviewerRole: 'senior',
            candidateLevel: 'mid',
            position: 'software-engineer'
          }
        }
      ];

      render(<InterviewAnalytics initialData={dataWithMissingFeedback} />);
      const totalInterviewsLabel = screen.getByText('Total Interviews');
      expect(totalInterviewsLabel.nextElementSibling).toHaveTextContent('0');
    });

    it('should handle missing metadata', () => {
      const dataWithMissingMetadata: InterviewData[] = [
        {
          id: '1',
          scheduledAt: '2024-01-15T10:00:00Z',
          status: 'completed'
        }
      ];

      render(<InterviewAnalytics initialData={dataWithMissingMetadata} />);
      const totalInterviewsLabel = screen.getByText('Total Interviews');
      expect(totalInterviewsLabel.nextElementSibling).toHaveTextContent('0');
    });
  });
});

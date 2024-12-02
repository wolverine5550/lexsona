import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import MatchSuccessRate from '@/components/analytics/MatchSuccessRate';
import { MatchSuccessData } from '@/components/analytics/types';

// Mock data
const mockMatchData: MatchSuccessData[] = [
  {
    id: '1',
    date: '2024-01-15T10:00:00Z',
    totalAttempts: 10,
    successfulMatches: 8,
    successRate: 0.8,
    metadata: {
      mentorField: 'technology',
      menteeField: 'software-development',
      mentorExperience: 'senior',
      menteeCareerStage: 'junior'
    }
  },
  {
    id: '2',
    date: '2024-01-15T14:00:00Z',
    totalAttempts: 15,
    successfulMatches: 12,
    successRate: 0.8,
    metadata: {
      mentorField: 'business',
      menteeField: 'marketing',
      mentorExperience: 'lead',
      menteeCareerStage: 'mid'
    }
  }
];

// Mock Select component
vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onValueChange, children }: any) => {
    // Extract options from SelectContent
    const selectContent = Array.isArray(children)
      ? children.find((child: any) => child.type.name === 'SelectContent')
      : children;
    const options = selectContent?.props?.children;

    return (
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid="select"
      >
        {options}
      </select>
    );
  },
  SelectTrigger: ({ children }: any) => children,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => children,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  )
}));

describe('MatchSuccessRate Component', () => {
  // Rendering
  describe('Rendering', () => {
    it('should render the component with initial data', () => {
      render(<MatchSuccessRate initialData={mockMatchData} />);
      expect(
        screen.getByRole('heading', { level: 3, name: 'Match Success Rate' })
      ).toBeInTheDocument();
    });

    it('should display loading state', () => {
      render(<MatchSuccessRate initialData={mockMatchData} isLoading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // Filtering
  describe('Filtering', () => {
    it('should handle date range filter changes', () => {
      const onFilterChange = vi.fn();
      render(
        <MatchSuccessRate
          initialData={mockMatchData}
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

    it('should handle field filter changes', async () => {
      const onFilterChange = vi.fn();
      render(
        <MatchSuccessRate
          initialData={mockMatchData}
          onFilterChange={onFilterChange}
        />
      );

      const mentorSelect = screen.getAllByTestId('select')[0]; // First select is mentor field
      fireEvent.change(mentorSelect, { target: { value: 'technology' } });

      await waitFor(() => {
        expect(onFilterChange).toHaveBeenCalledWith(
          expect.objectContaining({
            mentorField: 'technology'
          })
        );
      });
    });

    it('should clear all filters', () => {
      const onFilterChange = vi.fn();
      render(
        <MatchSuccessRate
          initialData={mockMatchData}
          onFilterChange={onFilterChange}
        />
      );

      // Set a filter first
      const mentorSelect = screen.getAllByTestId('select')[0]; // First select is mentor field
      fireEvent.change(mentorSelect, { target: { value: 'technology' } });

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
    it('should calculate overall success rate correctly', () => {
      render(<MatchSuccessRate initialData={mockMatchData} />);
      expect(
        screen.getByText(/Overall Success Rate:.*80\.0.*%/)
      ).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      render(<MatchSuccessRate initialData={[]} />);
      expect(
        screen.getByText(/Overall Success Rate:.*0.*%/)
      ).toBeInTheDocument();
    });
  });
});

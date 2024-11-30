import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ListeningTrends from '@/components/author/analytics/ListeningTrends';

// Mock the Chart.js components
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Chart Component</div>
}));

describe('ListeningTrends', () => {
  it('renders the chart component', () => {
    render(<ListeningTrends />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('displays time range options', () => {
    render(<ListeningTrends />);
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('3 Months')).toBeInTheDocument();
  });

  it('changes time range on selection', () => {
    render(<ListeningTrends />);
    const sevenDaysButton = screen.getByText('7 Days');
    fireEvent.click(sevenDaysButton);
    expect(sevenDaysButton).toHaveClass('bg-blue-100', 'text-blue-600');
  });
});

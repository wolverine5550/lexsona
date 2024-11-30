import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AudienceInsights from '@/components/author/analytics/AudienceInsights';

// Mock the Chart.js components
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="mock-doughnut-chart">Chart Component</div>
}));

describe('AudienceInsights', () => {
  it('renders demographics chart', () => {
    render(<AudienceInsights />);
    expect(screen.getByTestId('mock-doughnut-chart')).toBeInTheDocument();
  });

  it('displays engagement metrics', () => {
    render(<AudienceInsights />);
    expect(screen.getByText('Avg. Session Duration')).toBeInTheDocument();
    expect(screen.getByText('Return Listeners')).toBeInTheDocument();
    expect(screen.getByText('Top Location')).toBeInTheDocument();
  });

  it('formats metric values correctly', () => {
    render(<AudienceInsights />);
    expect(screen.getByText('12m 30s')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
  });
});

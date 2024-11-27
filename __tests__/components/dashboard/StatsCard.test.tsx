import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { describe, it, expect } from 'vitest';

describe('StatsCard', () => {
  it('should render basic stats', () => {
    render(<StatsCard title="Total Matches" value="24" />);

    expect(screen.getByText('Total Matches')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('should render upward trend', () => {
    render(
      <StatsCard
        title="Total Matches"
        value="24"
        trend="+12%"
        trendDirection="up"
      />
    );

    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+12%').closest('span')).toHaveClass(
      'text-green-500'
    );
  });

  it('should render downward trend', () => {
    render(
      <StatsCard
        title="Total Matches"
        value="24"
        trend="-5%"
        trendDirection="down"
      />
    );

    expect(screen.getByText('-5%')).toBeInTheDocument();
    expect(screen.getByText('-5%').closest('span')).toHaveClass('text-red-500');
  });
});

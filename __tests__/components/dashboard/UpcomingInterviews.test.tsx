import { render, screen } from '@testing-library/react';
import { UpcomingInterviews } from '@/components/dashboard/UpcomingInterviews';
import { describe, it, expect } from 'vitest';

describe('UpcomingInterviews', () => {
  it('should render interview list', () => {
    render(<UpcomingInterviews />);

    // Check if podcast names are rendered
    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();

    // Check if dates and times are rendered
    expect(screen.getByText('2024-01-20 at 14:00')).toBeInTheDocument();
    expect(screen.getByText('2024-01-22 at 15:30')).toBeInTheDocument();

    // Check if statuses are rendered with correct styling
    const scheduledStatus = screen.getByText('Scheduled');
    const pendingStatus = screen.getByText('Pending');

    expect(scheduledStatus).toBeInTheDocument();
    expect(scheduledStatus.closest('span')).toHaveClass('bg-green-500/10');
    expect(pendingStatus).toBeInTheDocument();
    expect(pendingStatus.closest('span')).toHaveClass('bg-yellow-500/10');
  });
});

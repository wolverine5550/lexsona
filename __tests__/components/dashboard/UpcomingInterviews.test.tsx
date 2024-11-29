import { render, screen } from '@testing-library/react';
import { UpcomingInterviews } from '@/components/dashboard/UpcomingInterviews';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';

describe('UpcomingInterviews', () => {
  beforeAll(() => {
    setupCommonMocks();
  });
  it('should render interview list', () => {
    render(<UpcomingInterviews />);

    // Use more specific queries
    const interviews = screen.getAllByRole('heading', { level: 3 });
    expect(interviews[0]).toHaveTextContent('The Author Hour');
    expect(interviews[1]).toHaveTextContent('Book Talk Daily');

    // Check dates
    expect(screen.getByText('2024-01-20 at 14:00')).toBeInTheDocument();
    expect(screen.getByText('2024-01-22 at 15:30')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { describe, it, expect } from 'vitest';

describe('ActivityFeed', () => {
  it('should render activity items', () => {
    render(<ActivityFeed />);

    // Check if titles are rendered
    expect(screen.getByText('New Match Found')).toBeInTheDocument();
    expect(screen.getByText('New Message')).toBeInTheDocument();

    // Check if descriptions are rendered
    expect(
      screen.getByText('You matched with "The Author Hour" podcast')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sarah from Book Talk Daily sent you a message')
    ).toBeInTheDocument();

    // Check if dates are rendered
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('2024-01-14')).toBeInTheDocument();
  });
});

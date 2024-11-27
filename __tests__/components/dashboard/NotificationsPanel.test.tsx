import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { describe, it, expect } from 'vitest';

describe('NotificationsPanel', () => {
  it('should show notification count badge', () => {
    render(<NotificationsPanel />);
    expect(screen.getByText('1')).toBeInTheDocument(); // One unread notification
  });

  it('should toggle panel on click', () => {
    render(<NotificationsPanel />);

    // Panel should be hidden initially
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Click to close
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('should render notification items', () => {
    render(<NotificationsPanel />);

    // Open panel
    fireEvent.click(screen.getByRole('button'));

    // Check notification content
    expect(screen.getByText('New Podcast Match')).toBeInTheDocument();
    expect(
      screen.getByText('You have a new 95% match with "The Author Hour"')
    ).toBeInTheDocument();
    expect(screen.getByText('Interview Confirmed')).toBeInTheDocument();
  });
});

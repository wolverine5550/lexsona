import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { describe, it, expect, vi } from 'vitest';

describe('NotificationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockNotifications = [
    {
      id: '1',
      title: 'Test Notification',
      message: 'Test message',
      read: false,
      created_at: new Date().toISOString()
    }
  ];

  it('should toggle panel on click', async () => {
    await act(async () => {
      render(<NotificationsPanel notifications={mockNotifications} />);
    });

    // Click toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Panel should be visible
    expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();

    // Click again to close
    fireEvent.click(toggleButton);
    expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument();
  });

  it('should render notification items', async () => {
    await act(async () => {
      render(<NotificationsPanel notifications={mockNotifications} />);
    });

    // Open panel
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);

    // Check content
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import {
  DashboardContext,
  DashboardContextType
} from '@/contexts/dashboard/DashboardContext';
import type { Database } from '@/types/database';

// Mock notifications
const mockNotifications: Database['public']['Tables']['notifications']['Row'][] =
  [
    {
      id: '1',
      author_id: 'author-1',
      type: 'match',
      title: 'New Podcast Match',
      description: 'You have a new 95% match with "The Author Hour"',
      read: false,
      priority: 'high',
      action_url: '/matches/1',
      metadata: { match_id: 'match-1' },
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      author_id: 'author-1',
      type: 'interview',
      title: 'Interview Confirmed',
      description: 'Your interview with Book Talk Daily is confirmed',
      read: true,
      priority: 'medium',
      action_url: '/interviews/2',
      metadata: { interview_id: 'int-1' },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }
  ];

// Mock context value
const mockContextValue: DashboardContextType = {
  state: {
    stats: {
      data: null,
      loading: false,
      error: null
    },
    matches: {
      data: [],
      loading: false,
      error: null
    },
    interviews: {
      data: [],
      loading: false,
      error: null
    },
    notifications: {
      data: mockNotifications,
      unreadCount: 1, // One unread notification
      loading: false,
      error: null
    },
    activities: {
      data: [],
      groupedData: [],
      loading: false,
      error: null
    }
  },
  // Mock all required actions
  fetchStats: vi.fn(),
  fetchMatches: vi.fn(),
  updateMatchStatus: vi.fn(),
  fetchInterviews: vi.fn(),
  scheduleInterview: vi.fn(),
  updateInterview: vi.fn(),
  fetchNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  fetchActivities: vi.fn(),
  fetchGroupedActivities: vi.fn()
};

describe('NotificationPanel', () => {
  it('should render notifications with unread count', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('1 unread notification')).toBeInTheDocument();
    expect(screen.getByText('New Podcast Match')).toBeInTheDocument();
    expect(
      screen.getByText('You have a new 95% match with "The Author Hour"')
    ).toBeInTheDocument();
  });

  it('should mark notification as read when clicked', async () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    const unreadNotification = screen
      .getByText('New Podcast Match')
      .closest('li');
    expect(unreadNotification).toHaveClass('opacity-75', { exact: false });

    fireEvent.click(unreadNotification!);
    expect(mockContextValue.markNotificationRead).toHaveBeenCalledWith('1');
  });

  it('should show loading state', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            notifications: {
              ...mockContextValue.state.notifications,
              loading: true
            }
          }
        }}
      >
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const errorMessage = 'Failed to load notifications';
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            notifications: {
              ...mockContextValue.state.notifications,
              error: errorMessage
            }
          }
        }}
      >
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show empty state when no notifications', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            notifications: {
              ...mockContextValue.state.notifications,
              data: [],
              unreadCount: 0
            }
          }
        }}
      >
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No notifications to display')).toBeInTheDocument();
  });

  it('should fetch notifications on mount', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <NotificationPanel onlyUnread />
      </DashboardContext.Provider>
    );

    expect(mockContextValue.fetchNotifications).toHaveBeenCalledWith(true);
  });

  it('should show correct priority indicators', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    const highPriorityIcon = screen.getByText('🔴');
    const mediumPriorityIcon = screen.getByText('🟡');

    expect(highPriorityIcon).toBeInTheDocument();
    expect(mediumPriorityIcon).toBeInTheDocument();
  });
});

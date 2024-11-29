import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardContext } from '@/contexts/dashboard/DashboardContext';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';

describe('ActivityFeed', () => {
  beforeAll(() => {
    setupCommonMocks();
  });

  const mockActivities = [
    {
      id: '1',
      type: 'match',
      title: 'New Match',
      description: 'You have a new podcast match',
      created_at: new Date().toISOString()
    }
  ];

  const mockContext = {
    state: {
      activities: {
        data: mockActivities,
        loading: false,
        error: null
      },
      matches: {
        data: [],
        loading: false,
        error: null
      },
      notifications: {
        data: [],
        loading: false,
        error: null
      },
      interviews: {
        data: [],
        loading: false,
        error: null
      },
      stats: {
        data: null,
        loading: false,
        error: null
      }
    },
    actions: {
      fetchActivities: vi.fn().mockResolvedValue(undefined),
      fetchMatches: vi.fn().mockResolvedValue(undefined),
      fetchNotifications: vi.fn().mockResolvedValue(undefined),
      fetchInterviews: vi.fn().mockResolvedValue(undefined),
      fetchStats: vi.fn().mockResolvedValue(undefined),
      updateMatchStatus: vi.fn().mockResolvedValue(undefined),
      markNotificationRead: vi.fn().mockResolvedValue(undefined),
      updateInterview: vi.fn().mockResolvedValue(undefined)
    },
    dispatch: vi.fn()
  };

  it('should render activities', () => {
    render(
      <DashboardContext.Provider value={mockContext}>
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('New Match')).toBeInTheDocument();
    expect(
      screen.getByText(/You have a new podcast match/i)
    ).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const loadingContext = {
      ...mockContext,
      state: {
        ...mockContext.state,
        activities: { data: [], loading: true, error: null }
      }
    };

    render(
      <DashboardContext.Provider value={loadingContext}>
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    const emptyContext = {
      ...mockContext,
      state: {
        ...mockContext.state,
        activities: { data: [], loading: false, error: null }
      }
    };

    render(
      <DashboardContext.Provider value={emptyContext}>
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No activities to display')).toBeInTheDocument();
  });

  it('should fetch activities on mount', () => {
    render(
      <DashboardContext.Provider value={mockContext}>
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(mockContext.actions.fetchActivities).toHaveBeenCalled();
  });
});

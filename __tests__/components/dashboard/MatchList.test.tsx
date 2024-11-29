import { render, screen } from '@testing-library/react';
import { MatchList } from '@/components/dashboard/MatchList';
import { DashboardContext } from '@/contexts/dashboard/DashboardContext';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';

describe('MatchList', () => {
  beforeAll(() => {
    setupCommonMocks();
  });

  const mockContext = {
    state: {
      matches: {
        data: [
          {
            id: '1',
            podcast_name: 'The Author Hour',
            match_score: 0.95,
            status: 'new',
            created_at: new Date().toISOString(),
            match_reason: ['Topic match', 'Style match']
          },
          {
            id: '2',
            podcast_name: 'Book Talk Daily',
            match_score: 0.88,
            status: 'pending',
            created_at: new Date().toISOString(),
            match_reason: ['Genre match']
          }
        ],
        loading: false,
        error: null
      },
      interviews: { data: [], loading: false, error: null },
      notifications: { data: [], loading: false, error: null },
      activities: { data: [], loading: false, error: null },
      stats: { data: null, loading: false, error: null }
    },
    actions: {
      fetchInterviews: vi.fn().mockResolvedValue(undefined),
      fetchMatches: vi.fn().mockResolvedValue(undefined),
      fetchNotifications: vi.fn().mockResolvedValue(undefined),
      fetchActivities: vi.fn().mockResolvedValue(undefined),
      fetchStats: vi.fn().mockResolvedValue(undefined),
      updateMatchStatus: vi.fn().mockResolvedValue(undefined),
      markNotificationRead: vi.fn().mockResolvedValue(undefined),
      updateInterview: vi.fn().mockResolvedValue(undefined)
    },
    dispatch: vi.fn()
  };

  it('should render matches with scores', () => {
    render(
      <DashboardContext.Provider value={mockContext}>
        <MatchList />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
    expect(screen.getByText(/95%/)).toBeInTheDocument();
    expect(screen.getByText(/88%/)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const loadingContext = {
      ...mockContext,
      state: {
        ...mockContext.state,
        matches: { data: [], loading: true, error: null }
      }
    };

    render(
      <DashboardContext.Provider value={loadingContext}>
        <MatchList />
      </DashboardContext.Provider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    const emptyContext = {
      ...mockContext,
      state: {
        ...mockContext.state,
        matches: { data: [], loading: false, error: null }
      }
    };

    render(
      <DashboardContext.Provider value={emptyContext}>
        <MatchList />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });
});

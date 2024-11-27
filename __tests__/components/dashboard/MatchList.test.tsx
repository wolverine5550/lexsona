import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchList } from '@/components/dashboard/MatchList';
import {
  DashboardContext,
  DashboardContextType
} from '@/contexts/dashboard/DashboardContext';
import type { Database } from '@/types/database';

// Mock matches
const mockMatches: (Database['public']['Tables']['matches']['Row'] & {
  podcast_name: string;
})[] = [
  {
    id: '1',
    author_id: 'author-1',
    podcast_id: 'pod-1',
    podcast_name: 'The Author Hour',
    match_score: 0.95,
    match_reason: ['Topic match', 'Audience size'],
    status: 'new',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    author_id: 'author-1',
    podcast_id: 'pod-2',
    podcast_name: 'Book Talk Daily',
    match_score: 0.85,
    match_reason: ['Genre match'],
    status: 'contacted',
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z'
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
      data: mockMatches,
      loading: false,
      error: null
    },
    interviews: {
      data: [],
      loading: false,
      error: null
    },
    notifications: {
      data: [],
      unreadCount: 0,
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

describe('MatchList', () => {
  it('should render matches with scores', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <MatchList />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText('95% Match')).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
    expect(screen.getByText('85% Match')).toBeInTheDocument();
  });

  it('should filter matches by status', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <MatchList filter="contacted" />
      </DashboardContext.Provider>
    );

    expect(screen.queryByText('The Author Hour')).not.toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
  });

  it('should sort matches by score', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <MatchList sortBy="score" />
      </DashboardContext.Provider>
    );

    const matches = screen.getAllByRole('heading');
    expect(matches[0]).toHaveTextContent('The Author Hour'); // Higher score first
    expect(matches[1]).toHaveTextContent('Book Talk Daily');
  });

  it('should sort matches by date', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <MatchList sortBy="date" />
      </DashboardContext.Provider>
    );

    const matches = screen.getAllByRole('heading');
    expect(matches[0]).toHaveTextContent('The Author Hour'); // Most recent first
    expect(matches[1]).toHaveTextContent('Book Talk Daily');
  });

  it('should update match status', async () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <MatchList />
      </DashboardContext.Provider>
    );

    const statusSelect = screen.getAllByRole('combobox')[2]; // Third select is status
    fireEvent.change(statusSelect, { target: { value: 'contacted' } });

    expect(mockContextValue.updateMatchStatus).toHaveBeenCalledWith(
      '1',
      'contacted'
    );
  });

  it('should show loading state', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            matches: {
              ...mockContextValue.state.matches,
              loading: true
            }
          }
        }}
      >
        <MatchList />
      </DashboardContext.Provider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            matches: {
              ...mockContextValue.state.matches,
              data: []
            }
          }
        }}
      >
        <MatchList />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });

  it('should respect limit prop', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <MatchList limit={1} />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.queryByText('Book Talk Daily')).not.toBeInTheDocument();
  });
});

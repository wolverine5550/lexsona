import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import {
  DashboardContext,
  DashboardContextType
} from '@/contexts/dashboard/DashboardContext';
import type { Database } from '@/types/database';

// Mock activities
const mockActivities: Database['public']['Tables']['activities']['Row'][] = [
  {
    id: '1',
    author_id: 'author-1',
    type: 'match',
    title: 'New Match Found',
    description: 'You matched with "The Author Hour" podcast',
    metadata: { podcast_id: 'pod-1' },
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    author_id: 'author-1',
    type: 'message',
    title: 'New Message',
    description: 'Sarah from Book Talk Daily sent you a message',
    metadata: { conversation_id: 'conv-1' },
    created_at: '2024-01-14T15:30:00Z'
  }
];

// Mock grouped activities
const mockGroupedActivities = [
  {
    date: '2024-01-15',
    activities: [mockActivities[0]]
  },
  {
    date: '2024-01-14',
    activities: [mockActivities[1]]
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
      data: [],
      unreadCount: 0,
      loading: false,
      error: null
    },
    activities: {
      data: mockActivities,
      groupedData: mockGroupedActivities,
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

describe('ActivityFeed', () => {
  it('should render activity items in list view', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('New Match Found')).toBeInTheDocument();
    expect(screen.getByText('New Message')).toBeInTheDocument();
    expect(
      screen.getByText('You matched with "The Author Hour" podcast')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Sarah from Book Talk Daily sent you a message')
    ).toBeInTheDocument();
  });

  it('should render activities grouped by date', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <ActivityFeed grouped />
      </DashboardContext.Provider>
    );

    // Check date headers
    expect(screen.getByText(/January 15/)).toBeInTheDocument();
    expect(screen.getByText(/January 14/)).toBeInTheDocument();

    // Check activities under correct dates
    const sections = screen.getAllByRole('region');
    expect(sections).toHaveLength(2);
    expect(sections[0]).toHaveTextContent('New Match Found');
    expect(sections[1]).toHaveTextContent('New Message');
  });

  it('should show loading state', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            activities: {
              ...mockContextValue.state.activities,
              loading: true
            }
          }
        }}
      >
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const errorMessage = 'Failed to load activities';
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            activities: {
              ...mockContextValue.state.activities,
              error: errorMessage
            }
          }
        }}
      >
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show empty state when no activities', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            activities: {
              ...mockContextValue.state.activities,
              data: [],
              groupedData: []
            }
          }
        }}
      >
        <ActivityFeed />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No activities to display')).toBeInTheDocument();
  });

  it('should fetch activities on mount', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <ActivityFeed limit={10} />
      </DashboardContext.Provider>
    );

    expect(mockContextValue.fetchActivities).toHaveBeenCalledWith(10);
  });

  it('should fetch grouped activities when grouped prop is true', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <ActivityFeed grouped />
      </DashboardContext.Provider>
    );

    expect(mockContextValue.fetchGroupedActivities).toHaveBeenCalledWith(7);
  });
});

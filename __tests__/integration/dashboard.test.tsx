// Import and setup mocks first
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import {
  DashboardContext,
  type DashboardContextType
} from '@/contexts/dashboard/DashboardContext';
import '../mocks/supabase';

// Mock the components
vi.mock('@/components/dashboard/MatchList', () => {
  const MatchList = () => (
    <div data-testid="match-list">
      <div>Test Podcast</div>
    </div>
  );
  return { MatchList };
});

vi.mock('@/components/dashboard/NotificationPanel', () => {
  const NotificationPanel = () => (
    <div data-testid="notifications-panel">Notifications</div>
  );
  return { NotificationPanel };
});

vi.mock('@/components/dashboard/InterviewSchedule', () => {
  const InterviewSchedule = () => (
    <div data-testid="interview-schedule">Interviews</div>
  );
  return { InterviewSchedule };
});

vi.mock('@/components/dashboard/ActivityFeed', () => {
  const ActivityFeed = () => <div data-testid="activity-feed">Activities</div>;
  return { ActivityFeed };
});

// Mock the dashboard service
vi.mock('@/services/dashboard/base', () => ({
  dashboardService: {
    getMatches: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          podcastId: 'pod1',
          status: 'pending',
          score: 0.8,
          podcast: {
            id: 'pod1',
            title: 'Test Podcast',
            image_url: 'https://test.com/image.jpg',
            publisher: 'Test Publisher'
          }
        }
      ],
      error: null
    }),
    getNotifications: vi.fn().mockResolvedValue({ data: [], error: null }),
    getInterviews: vi.fn().mockResolvedValue({ data: [], error: null }),
    getActivities: vi.fn().mockResolvedValue({ data: [], error: null }),
    getStats: vi.fn().mockResolvedValue({ data: {}, error: null }),

    matches: {
      subscribeToMatches: vi.fn().mockReturnValue(() => {
        return () => {};
      })
    },
    notifications: {
      subscribeToNotifications: vi.fn().mockReturnValue(() => {
        return () => {};
      })
    },
    interviews: {
      subscribeToInterviews: vi.fn().mockReturnValue(() => {
        return () => {};
      })
    }
  }
}));

// Create mock context
const mockDashboardContext: DashboardContextType = {
  dispatch: vi.fn(),
  state: {
    matches: {
      data: [
        {
          id: '1',
          podcastId: 'pod1',
          status: 'pending',
          score: 0.8,
          podcast: {
            id: 'pod1',
            title: 'Test Podcast',
            image_url: 'https://test.com/image.jpg',
            publisher: 'Test Publisher'
          }
        }
      ],
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
    activities: {
      data: [],
      loading: false,
      error: null
    },
    stats: {
      data: {},
      loading: false,
      error: null
    }
  },
  actions: {
    fetchMatches: vi.fn(),
    fetchNotifications: vi.fn(),
    fetchInterviews: vi.fn(),
    fetchActivities: vi.fn(),
    fetchStats: vi.fn(),
    updateMatchStatus: vi.fn(),
    markNotificationRead: vi.fn(),
    updateInterview: vi.fn()
  }
};

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load and display all dashboard components', async () => {
    render(
      <DashboardContext.Provider value={mockDashboardContext}>
        <Dashboard />
      </DashboardContext.Provider>
    );

    // Wait for components to load and verify they're rendered
    await waitFor(() => {
      expect(screen.getByTestId('match-list')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();
      expect(screen.getByTestId('interview-schedule')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });

    // Verify the content is rendered
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
  });
});

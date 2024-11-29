// Import and setup mocks first
import { vi } from 'vitest';
import { setupSupabaseMock } from '../setup/mockSupabase';

// Setup Supabase mock before any other imports
setupSupabaseMock();

// Then import the rest
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { DashboardProvider } from '@/contexts/dashboard/DashboardContext';

// Mock the dashboard context
vi.mock('@/contexts/dashboard/DashboardContext', () => ({
  ...vi.importActual('@/contexts/dashboard/DashboardContext'),
  DashboardProvider: ({ children }: { children: React.ReactNode }) => children,
  useDashboard: () => ({
    state: {
      matches: {
        data: [{ id: '1', title: 'Recent Match 1' }],
        loading: false,
        error: null
      },
      interviews: {
        data: [{ id: '1', title: 'Upcoming Interview 1' }],
        loading: false,
        error: null
      },
      activities: {
        data: [{ id: '1', title: 'Recent Activity 1' }],
        loading: false,
        error: null
      },
      notifications: {
        data: [],
        loading: false,
        error: null,
        unreadCount: 0
      },
      stats: {
        data: null,
        loading: false,
        error: null
      }
    },
    actions: {
      fetchMatches: vi.fn().mockResolvedValue(undefined),
      fetchInterviews: vi.fn().mockResolvedValue(undefined),
      fetchActivities: vi.fn().mockResolvedValue(undefined),
      fetchNotifications: vi.fn().mockResolvedValue(undefined),
      fetchStats: vi.fn().mockResolvedValue(undefined),
      updateMatchStatus: vi.fn().mockResolvedValue(undefined)
    }
  })
}));

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load and display all dashboard components', async () => {
    const { unmount } = render(
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    );

    try {
      await waitFor(() => {
        expect(
          screen.queryByTestId('loading-skeleton')
        ).not.toBeInTheDocument();
      });

      // Verify dashboard sections are present with their content
      expect(screen.getByText('Recent Match 1')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Interview 1')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity 1')).toBeInTheDocument();
    } finally {
      unmount();
    }
  });
});

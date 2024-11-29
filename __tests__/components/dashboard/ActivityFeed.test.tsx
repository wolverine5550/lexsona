import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import {
  DashboardProvider,
  useDashboard
} from '@/contexts/dashboard/DashboardContext';
import { setupSupabaseMock } from '../../setup/mockSupabase';
import type { Database } from '@/types/database';

// Set up Supabase mock
setupSupabaseMock();

// Mock activity data
const mockActivities = [
  {
    id: '1',
    author_id: 'author-1',
    type: 'match' as const,
    title: 'New Podcast Match',
    description: 'You have a new match with The Author Hour',
    metadata: { match_id: 'match-1' },
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    author_id: 'author-1',
    type: 'interview' as const,
    title: 'Interview Scheduled',
    description: 'Interview scheduled with Book Talk Daily',
    metadata: { interview_id: 'interview-1' },
    created_at: '2024-01-14T15:30:00Z'
  }
] as const;

// Create a mock function for useDashboard
const mockUseDashboard = vi.fn();

// Mock the context hook
vi.mock('@/contexts/dashboard/DashboardContext', () => ({
  DashboardProvider: ({ children }: { children: React.ReactNode }) => children,
  useDashboard: () => mockUseDashboard()
}));

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.mockReturnValue({
      state: {
        activities: {
          data: mockActivities,
          loading: false,
          error: null
        }
      },
      actions: {
        fetchActivities: vi.fn()
      }
    });
  });

  it('should render activities', () => {
    render(
      <DashboardProvider>
        <ActivityFeed />
      </DashboardProvider>
    );

    expect(screen.getByText('New Podcast Match')).toBeInTheDocument();
    expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
    expect(
      screen.getByText('You have a new match with The Author Hour')
    ).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseDashboard.mockReturnValue({
      state: {
        activities: {
          data: [],
          loading: true,
          error: null
        }
      },
      actions: {
        fetchActivities: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <ActivityFeed />
      </DashboardProvider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    mockUseDashboard.mockReturnValue({
      state: {
        activities: {
          data: [],
          loading: false,
          error: null
        }
      },
      actions: {
        fetchActivities: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <ActivityFeed />
      </DashboardProvider>
    );

    expect(screen.getByText('No activities to display')).toBeInTheDocument();
  });

  it('should fetch activities on mount', () => {
    const fetchActivities = vi.fn();
    mockUseDashboard.mockReturnValue({
      state: {
        activities: {
          data: mockActivities,
          loading: false,
          error: null
        }
      },
      actions: {
        fetchActivities
      }
    });

    render(
      <DashboardProvider>
        <ActivityFeed />
      </DashboardProvider>
    );

    expect(fetchActivities).toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardProvider } from '@/contexts/dashboard/DashboardContext';
import { dashboardService } from '@/services/dashboard/base';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { MatchList } from '@/components/dashboard/MatchList';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { InterviewSchedule } from '@/components/dashboard/InterviewSchedule';
import type { Database } from '@/types/database';
import type { ApiResponse } from '@/types/services';
import type { MatchWithPodcast } from '@/components/dashboard/MatchList';
import type { InterviewWithPodcast } from '@/components/dashboard/InterviewSchedule';

// Mock the dashboard service
vi.mock('@/services/dashboard/base', () => {
  return {
    dashboardService: {
      getStats: vi.fn(),
      matches: {
        getRecentMatches: vi.fn(),
        updateMatchStatus: vi.fn()
      },
      interviews: {
        getUpcomingInterviews: vi.fn(),
        scheduleInterview: vi.fn(),
        updateInterview: vi.fn()
      },
      notifications: {
        getNotifications: vi.fn(),
        markAsRead: vi.fn(),
        subscribeToNotifications: vi.fn()
      },
      activities: {
        getRecentActivities: vi.fn(),
        getGroupedActivities: vi.fn()
      }
    }
  };
});

// Define extended types for our mocks that include podcast names
type MockMatch = Database['public']['Tables']['matches']['Row'] & {
  podcast_name: string;
};

type MockInterview = Database['public']['Tables']['interviews']['Row'] & {
  podcast_name: string;
};

// Mock data with proper types
const mockStats: ApiResponse<
  Database['public']['Views']['author_stats']['Row']
> = {
  data: {
    author_id: 'author-1',
    total_matches: 5,
    pending_requests: 2,
    upcoming_interviews: 1,
    profile_views: 10,
    updated_at: new Date().toISOString()
  }
};

// Update mock data to use component types
const mockMatches: ApiResponse<MatchWithPodcast[]> = {
  data: [
    {
      id: 'match-1',
      author_id: 'author-1',
      podcast_id: 'pod-1',
      podcast_name: 'The Author Hour',
      match_score: 0.95,
      match_reason: ['Topic match', 'Audience size'],
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

const mockNotifications: Database['public']['Tables']['notifications']['Row'][] =
  [
    {
      id: 'notif-1',
      author_id: 'author-1',
      type: 'match',
      title: 'New Match',
      description: 'You have a new podcast match',
      read: false,
      priority: 'high',
      action_url: '/matches/1',
      metadata: { match_id: 'match-1' },
      created_at: new Date().toISOString()
    }
  ];

// Update mock data to use component types
const mockInterviews: ApiResponse<InterviewWithPodcast[]> = {
  data: [
    {
      id: 'interview-1',
      author_id: 'author-1',
      podcast_id: 'pod-1',
      podcast_name: 'The Author Hour',
      scheduled_date: '2024-01-20',
      scheduled_time: '10:00:00',
      duration: 60,
      status: 'scheduled',
      notes: 'Discuss new book',
      meeting_link: 'https://meet.example.com/1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// Add missing fields to mock activity
const mockActivity: Database['public']['Tables']['activities']['Row'] = {
  id: 'activity-1',
  author_id: 'author-1',
  type: 'match',
  title: 'Match Status Updated',
  description: 'Match status changed to contacted',
  metadata: null,
  created_at: new Date().toISOString()
};

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mock responses with proper typing
    (dashboardService.getStats as any).mockResolvedValue(mockStats);
    (dashboardService.matches.getRecentMatches as any).mockResolvedValue(
      mockMatches
    );
    (dashboardService.notifications.getNotifications as any).mockResolvedValue({
      data: mockNotifications
    });
    (
      dashboardService.interviews.getUpcomingInterviews as any
    ).mockResolvedValue({
      data: mockInterviews
    });
    (dashboardService.activities.getRecentActivities as any).mockResolvedValue({
      data: []
    });
  });

  it('should load and display all dashboard components', async () => {
    render(
      <DashboardProvider>
        <div>
          <MatchList />
          <NotificationPanel />
          <InterviewSchedule />
          <ActivityFeed />
        </div>
      </DashboardProvider>
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(dashboardService.getStats).toHaveBeenCalled();
      expect(dashboardService.matches.getRecentMatches).toHaveBeenCalled();
      expect(
        dashboardService.notifications.getNotifications
      ).toHaveBeenCalled();
      expect(
        dashboardService.interviews.getUpcomingInterviews
      ).toHaveBeenCalled();
    });

    // Verify components render with data
    expect(
      screen.getByText(`Podcast #${mockMatches.data[0].podcast_id}`)
    ).toBeInTheDocument();
    expect(screen.getByText('95% Match')).toBeInTheDocument();
    expect(screen.getByText('New Match')).toBeInTheDocument();
  });

  it('should update match status and reflect in activities', async () => {
    (dashboardService.matches.updateMatchStatus as any).mockResolvedValue({
      data: null
    });
    (dashboardService.activities.getRecentActivities as any).mockResolvedValue({
      data: [mockActivity]
    });

    render(
      <DashboardProvider>
        <div>
          <MatchList />
          <ActivityFeed />
        </div>
      </DashboardProvider>
    );

    // Wait for initial load and check for podcast ID instead of name
    await waitFor(() => {
      expect(
        screen.getByText(`Podcast #${mockMatches.data[0].podcast_id}`)
      ).toBeInTheDocument();
    });

    // Update match status
    const statusSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(statusSelect, { target: { value: 'contacted' } });

    // Verify activity feed updates
    await waitFor(() => {
      expect(screen.getByText('Match Status Updated')).toBeInTheDocument();
    });
  });

  it('should schedule interview and update notifications', async () => {
    const newInterview: Database['public']['Tables']['interviews']['Row'] = {
      id: 'interview-2',
      author_id: 'author-1',
      podcast_id: 'pod-2',
      scheduled_date: '2024-02-01',
      scheduled_time: '10:00:00',
      duration: 60,
      status: 'scheduled',
      notes: null,
      meeting_link: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    (dashboardService.interviews.scheduleInterview as any).mockResolvedValue({
      data: newInterview
    });

    const scheduledNotification: Database['public']['Tables']['notifications']['Row'] =
      {
        id: 'notif-2',
        author_id: 'author-1',
        type: 'interview',
        title: 'Interview Scheduled',
        description: 'New interview scheduled with Book Talk Daily',
        read: false,
        priority: 'high',
        action_url: null,
        metadata: { interview_id: 'interview-2' },
        created_at: new Date().toISOString()
      };

    (
      dashboardService.notifications.getNotifications as any
    ).mockResolvedValueOnce({
      data: [...mockNotifications, scheduledNotification]
    });

    render(
      <DashboardProvider>
        <div>
          <InterviewSchedule />
          <NotificationPanel />
        </div>
      </DashboardProvider>
    );

    // Schedule new interview
    fireEvent.click(screen.getByText('Schedule Interview'));
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Verify notification appears
    await waitFor(() => {
      expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
    });
  });

  it('should handle error states across components', async () => {
    const error = 'Failed to fetch data';
    (dashboardService.getStats as any).mockRejectedValue(new Error(error));
    (dashboardService.matches.getRecentMatches as any).mockRejectedValue(
      new Error(error)
    );

    render(
      <DashboardProvider>
        <div>
          <MatchList />
          <NotificationPanel />
        </div>
      </DashboardProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText(error)).toHaveLength(2); // Error shown in both components
    });
  });

  it('should handle real-time notifications', async () => {
    let notificationCallback: (
      notification: Database['public']['Tables']['notifications']['Row']
    ) => void;

    (
      dashboardService.notifications.subscribeToNotifications as any
    ).mockImplementation(
      (authorId: string, callback: typeof notificationCallback) => {
        notificationCallback = callback;
        return () => {};
      }
    );

    render(
      <DashboardProvider>
        <NotificationPanel />
      </DashboardProvider>
    );

    // Simulate real-time notification
    const newNotification: Database['public']['Tables']['notifications']['Row'] =
      {
        id: 'notif-3',
        author_id: 'author-1',
        type: 'system',
        title: 'Real-time Update',
        description: 'New notification received',
        read: false,
        priority: 'medium',
        action_url: null,
        metadata: null,
        created_at: new Date().toISOString()
      };

    await waitFor(() => {
      notificationCallback(newNotification);
    });

    expect(screen.getByText('Real-time Update')).toBeInTheDocument();
  });
});

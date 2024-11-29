import { render, screen } from '@testing-library/react';
import { InterviewSchedule } from '@/components/dashboard/InterviewSchedule';
import { DashboardContext } from '@/contexts/dashboard/DashboardContext';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';

describe('InterviewSchedule', () => {
  beforeAll(() => {
    setupCommonMocks();
  });

  const mockContext = {
    state: {
      interviews: {
        data: [
          {
            id: '1',
            podcast_name: 'The Author Hour',
            scheduled_date: '2024-01-20',
            scheduled_time: '14:00',
            status: 'scheduled'
          },
          {
            id: '2',
            podcast_name: 'Book Talk Daily',
            scheduled_date: '2024-01-22',
            scheduled_time: '15:30',
            status: 'pending'
          }
        ],
        loading: false,
        error: null
      },
      matches: { data: [], loading: false, error: null },
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

  it('should render interview list', () => {
    render(
      <DashboardContext.Provider value={mockContext}>
        <InterviewSchedule />
      </DashboardContext.Provider>
    );

    // Use more specific queries
    const interviews = screen.getAllByRole('heading', { level: 3 });
    expect(interviews[0]).toHaveTextContent('The Author Hour');
    expect(interviews[1]).toHaveTextContent('Book Talk Daily');

    // Check dates with the actual format used in the component
    expect(screen.getByText('Sat, Jan 20, 2:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Mon, Jan 22, 3:30 PM')).toBeInTheDocument();
  });
});

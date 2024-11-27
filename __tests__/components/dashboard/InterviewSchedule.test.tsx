import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterviewSchedule } from '@/components/dashboard/InterviewSchedule';
import {
  DashboardContext,
  DashboardContextType
} from '@/contexts/dashboard/DashboardContext';
import type { Database } from '@/types/database';

// Mock interviews
const mockInterviews: (Database['public']['Tables']['interviews']['Row'] & {
  podcast_name: string;
})[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
    author_id: 'author-1',
    podcast_id: 'pod-2',
    podcast_name: 'Book Talk Daily',
    scheduled_date: '2024-01-25',
    scheduled_time: '15:30:00',
    duration: 45,
    status: 'pending',
    notes: null,
    meeting_link: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock context value
const mockContextValue: DashboardContextType = {
  state: {
    stats: {
      data: { author_id: 'author-1' } as any,
      loading: false,
      error: null
    },
    matches: {
      data: [],
      loading: false,
      error: null
    },
    interviews: {
      data: mockInterviews,
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

describe('InterviewSchedule', () => {
  it('should render interviews in list view', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <InterviewSchedule />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
    expect(screen.getByText('60 minutes')).toBeInTheDocument();
    expect(screen.getByText('Discuss new book')).toBeInTheDocument();
  });

  it('should filter interviews by status', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <InterviewSchedule filter="upcoming" />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
  });

  it('should filter completed interviews', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <InterviewSchedule filter="completed" />
      </DashboardContext.Provider>
    );

    expect(screen.queryByText('The Author Hour')).not.toBeInTheDocument();
    expect(screen.queryByText('Book Talk Daily')).not.toBeInTheDocument();
  });

  it('should show schedule form when button is clicked', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <InterviewSchedule />
      </DashboardContext.Provider>
    );

    fireEvent.click(screen.getByText('Schedule Interview'));
    expect(screen.getByText('Schedule New Interview')).toBeInTheDocument();
  });

  it('should handle interview scheduling', async () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <InterviewSchedule />
      </DashboardContext.Provider>
    );

    // Open form
    fireEvent.click(screen.getByText('Schedule Interview'));

    // Fill form
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '45' }
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'pod-1' }
    });
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: '2024-02-01' }
    });
    fireEvent.change(screen.getByLabelText('Time'), {
      target: { value: '14:00' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Schedule'));

    expect(mockContextValue.scheduleInterview).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: 'author-1',
        podcast_id: 'pod-1',
        duration: 45,
        scheduled_date: '2024-02-01',
        scheduled_time: '14:00',
        status: 'scheduled'
      })
    );
  });

  it('should update interview status', () => {
    render(
      <DashboardContext.Provider value={mockContextValue}>
        <InterviewSchedule />
      </DashboardContext.Provider>
    );

    const statusSelect = screen.getAllByRole('combobox')[2]; // Third select is status
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    expect(mockContextValue.updateInterview).toHaveBeenCalledWith('1', {
      status: 'completed'
    });
  });

  it('should show loading state', () => {
    render(
      <DashboardContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            interviews: {
              ...mockContextValue.state.interviews,
              loading: true
            }
          }
        }}
      >
        <InterviewSchedule />
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
            interviews: {
              ...mockContextValue.state.interviews,
              data: []
            }
          }
        }}
      >
        <InterviewSchedule />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No interviews scheduled')).toBeInTheDocument();
  });
});

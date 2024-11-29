import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InterviewSchedule } from '@/components/dashboard/InterviewSchedule';
import {
  DashboardProvider,
  useDashboard
} from '@/contexts/dashboard/DashboardContext';
import { setupSupabaseMock } from '../../setup/mockSupabase';
import type { Database } from '@/types/database';

// Set up Supabase mock
setupSupabaseMock();

// Mock interview data
const mockInterviews = [
  {
    id: '1',
    author_id: 'author-1',
    podcast_id: 'pod-1',
    podcast_name: 'The Author Hour',
    scheduled_date: '2024-02-15',
    scheduled_time: '14:00:00',
    duration: 60,
    status: 'scheduled' as const,
    notes: 'Discuss new book release',
    meeting_link: 'https://meet.google.com/abc-123',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    author_id: 'author-1',
    podcast_id: 'pod-2',
    podcast_name: 'Book Talk Daily',
    scheduled_date: '2024-02-20',
    scheduled_time: '15:30:00',
    duration: 45,
    status: 'pending' as const,
    notes: null,
    meeting_link: null,
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z'
  }
] as const;

// Create a mock function for useDashboard
const mockUseDashboard = vi.fn();

// Mock the context hook
vi.mock('@/contexts/dashboard/DashboardContext', () => ({
  DashboardProvider: ({ children }: { children: React.ReactNode }) => children,
  useDashboard: () => mockUseDashboard()
}));

describe('InterviewSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.mockReturnValue({
      state: {
        interviews: {
          data: mockInterviews,
          loading: false,
          error: null
        }
      },
      actions: {
        fetchInterviews: vi.fn(),
        updateInterview: vi.fn()
      }
    });
  });

  it('should render interviews', () => {
    render(
      <DashboardProvider>
        <InterviewSchedule />
      </DashboardProvider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
    expect(screen.getByText('Thu, Feb 15, 2:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Tue, Feb 20, 3:30 PM')).toBeInTheDocument();
  });

  it('should filter interviews by status', () => {
    const mockInterviewsWithStatus = [
      {
        ...mockInterviews[0],
        status: 'scheduled' as const
      },
      {
        ...mockInterviews[1],
        status: 'completed' as const
      }
    ];

    mockUseDashboard.mockReturnValue({
      state: {
        interviews: {
          data: mockInterviewsWithStatus,
          loading: false,
          error: null
        }
      },
      actions: {
        fetchInterviews: vi.fn(),
        updateInterview: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <InterviewSchedule filter="upcoming" />
      </DashboardProvider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.queryByText('Book Talk Daily')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseDashboard.mockReturnValue({
      state: {
        interviews: {
          data: [],
          loading: true,
          error: null
        }
      },
      actions: {
        fetchInterviews: vi.fn(),
        updateInterview: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <InterviewSchedule />
      </DashboardProvider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    mockUseDashboard.mockReturnValue({
      state: {
        interviews: {
          data: [],
          loading: false,
          error: null
        }
      },
      actions: {
        fetchInterviews: vi.fn(),
        updateInterview: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <InterviewSchedule />
      </DashboardProvider>
    );

    expect(screen.getByText('No interviews scheduled')).toBeInTheDocument();
  });

  it('should fetch interviews on mount', () => {
    const fetchInterviews = vi.fn();
    mockUseDashboard.mockReturnValue({
      state: {
        interviews: {
          data: mockInterviews,
          loading: false,
          error: null
        }
      },
      actions: {
        fetchInterviews,
        updateInterview: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <InterviewSchedule />
      </DashboardProvider>
    );

    expect(fetchInterviews).toHaveBeenCalled();
  });
});

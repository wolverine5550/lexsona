import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchList } from '@/components/dashboard/MatchList';
import {
  DashboardProvider,
  useDashboard
} from '@/contexts/dashboard/DashboardContext';
import { setupSupabaseMock } from '../../setup/mockSupabase';
import type { Database } from '@/types/database';

// Set up Supabase mock
setupSupabaseMock();

// Mock match data
const mockMatches = [
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
] as const;

// Mock the dashboard context
const mockContextValue = {
  state: {
    matches: {
      data: mockMatches,
      loading: false,
      error: null
    }
  },
  actions: {
    fetchMatches: vi.fn(),
    updateMatchStatus: vi.fn()
  }
};

// Create a mock function for useDashboard
const mockUseDashboard = vi.fn().mockReturnValue(mockContextValue);

// Mock the context hook
vi.mock('@/contexts/dashboard/DashboardContext', () => ({
  DashboardProvider: ({ children }: { children: React.ReactNode }) => children,
  useDashboard: () => mockUseDashboard()
}));

describe('MatchList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.mockReturnValue(mockContextValue);
  });

  it('should render matches with scores', () => {
    render(
      <DashboardProvider>
        <MatchList />
      </DashboardProvider>
    );

    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText(/95.*%/)).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
    expect(screen.getByText(/85.*%/)).toBeInTheDocument();
  });

  it('should filter matches by status', () => {
    render(
      <DashboardProvider>
        <MatchList filter="contacted" />
      </DashboardProvider>
    );

    expect(screen.queryByText('The Author Hour')).not.toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const loadingContextValue = {
      ...mockContextValue,
      state: {
        ...mockContextValue.state,
        matches: {
          ...mockContextValue.state.matches,
          loading: true
        }
      }
    };

    mockUseDashboard.mockReturnValue(loadingContextValue);

    render(
      <DashboardProvider>
        <MatchList />
      </DashboardProvider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    const emptyContextValue = {
      ...mockContextValue,
      state: {
        ...mockContextValue.state,
        matches: {
          ...mockContextValue.state.matches,
          data: []
        }
      }
    };

    mockUseDashboard.mockReturnValue(emptyContextValue);

    render(
      <DashboardProvider>
        <MatchList />
      </DashboardProvider>
    );

    expect(screen.getByText('No matches found')).toBeInTheDocument();
  });
});

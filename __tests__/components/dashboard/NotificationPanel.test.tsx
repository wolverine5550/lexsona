import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import {
  DashboardProvider,
  useDashboard
} from '@/contexts/dashboard/DashboardContext';
import { setupSupabaseMock } from '../../setup/mockSupabase';

// Set up Supabase mock
setupSupabaseMock();

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    author_id: 'author-1',
    type: 'match',
    title: 'New Match',
    message: 'You have a new podcast match',
    read: false,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    author_id: 'author-1',
    type: 'interview',
    title: 'Interview Scheduled',
    message: 'Your interview has been scheduled',
    read: true,
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

describe('NotificationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboard.mockReturnValue({
      state: {
        notifications: {
          data: mockNotifications,
          loading: false,
          error: null,
          unreadCount: 2
        }
      },
      actions: {
        fetchNotifications: vi.fn(),
        markNotificationRead: vi.fn()
      }
    });
  });

  it('should render notifications', () => {
    render(
      <DashboardProvider>
        <NotificationPanel />
      </DashboardProvider>
    );

    // Check for notification titles
    expect(screen.getByText('New Match')).toBeInTheDocument();
    expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();

    // Check for unread count
    expect(screen.getByText('2 unread notifications')).toBeInTheDocument();

    // Check for notification timestamps
    expect(screen.getByText(/318d ago/i)).toBeInTheDocument();
    expect(screen.getByText(/319d ago/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseDashboard.mockReturnValue({
      state: {
        notifications: {
          data: [],
          loading: true,
          error: null
        }
      },
      actions: {
        fetchNotifications: vi.fn(),
        markNotificationRead: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <NotificationPanel />
      </DashboardProvider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    mockUseDashboard.mockReturnValue({
      state: {
        notifications: {
          data: [],
          loading: false,
          error: null
        }
      },
      actions: {
        fetchNotifications: vi.fn(),
        markNotificationRead: vi.fn()
      }
    });

    render(
      <DashboardProvider>
        <NotificationPanel />
      </DashboardProvider>
    );

    expect(screen.getByText('No notifications to display')).toBeInTheDocument();
  });
});

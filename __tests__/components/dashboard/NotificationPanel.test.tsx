import { render, screen } from '@testing-library/react';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardContext } from '@/contexts/dashboard/DashboardContext';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          data: null,
          error: null
        })
      })
    }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null })
    }
  })
}));

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

describe('NotificationPanel', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'match',
      title: 'New Match',
      message: 'Test notification',
      read: false,
      created_at: new Date().toISOString(),
      unread: true
    }
  ];

  const createMockContext = (overrides = {}) => ({
    state: {
      notifications: {
        data: [],
        loading: false,
        error: null,
        unreadCount: 0,
        ...overrides
      }
    },
    actions: {
      markNotificationRead: vi.fn(),
      fetchNotifications: vi.fn()
    },
    dispatch: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notifications', () => {
    const mockContext = createMockContext({
      data: mockNotifications,
      unreadCount: 1
    });

    render(
      <DashboardContext.Provider value={mockContext as any}>
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    // Check for notification title
    expect(screen.getByText('New Match')).toBeInTheDocument();

    // Check for unread count
    expect(screen.getByText('1 unread notification')).toBeInTheDocument();

    // Check for timestamp
    expect(screen.getByText('just now')).toBeInTheDocument();

    // Check for unread indicator
    expect(screen.getByRole('button')).toHaveClass('py-4');
  });

  it('should show loading state', () => {
    const mockContext = createMockContext({
      loading: true
    });

    render(
      <DashboardContext.Provider value={mockContext as any}>
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should show empty state', () => {
    const mockContext = createMockContext();

    render(
      <DashboardContext.Provider value={mockContext as any}>
        <NotificationPanel />
      </DashboardContext.Provider>
    );

    expect(screen.getByText('No notifications to display')).toBeInTheDocument();
  });
});

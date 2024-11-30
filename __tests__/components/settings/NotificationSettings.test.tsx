import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationSettings from '@/app/settings/notifications/page';
import { settingsService } from '@/services/settings/base';
import { useSession } from '@/hooks/useSession';

// Mock the session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn()
}));

// Mock the settings service
vi.mock('@/services/settings/base', () => ({
  settingsService: {
    notifications: {
      getPreferences: vi.fn(),
      updatePreferences: vi.fn(),
      updatePushSubscription: vi.fn()
    }
  }
}));

describe('NotificationSettings', () => {
  // Mock user data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  // Mock initial preferences
  const mockPreferences = {
    preferences: {
      email_notifications: {
        match_found: true,
        interview_scheduled: true,
        interview_reminder: false,
        message_received: true,
        review_posted: false
      },
      in_app_notifications: {
        match_found: true,
        interview_scheduled: true,
        interview_reminder: true,
        message_received: true,
        review_posted: true
      },
      push_notifications: {
        enabled: false,
        match_found: true,
        interview_scheduled: true,
        interview_reminder: true,
        message_received: true,
        review_posted: true
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: { user: mockUser } });
    (settingsService.notifications.getPreferences as any).mockResolvedValue({
      data: mockPreferences,
      error: null
    });
  });

  // Test loading state
  it('should show loading skeleton initially', () => {
    render(<NotificationSettings />);
    expect(
      screen.getByTestId('notification-settings-skeleton')
    ).toBeInTheDocument();
  });

  // Test initial data loading
  it('should load and display existing preferences', async () => {
    render(<NotificationSettings />);

    await waitFor(() => {
      // Check email notifications
      const emailMatchCheckbox = screen.getByLabelText(
        /new podcast matches/i
      ) as HTMLInputElement;
      expect(emailMatchCheckbox.checked).toBe(true);

      // Check in-app notifications
      const inAppInterviewCheckbox = screen.getByLabelText(
        /interview confirmations/i,
        { exact: false }
      ) as HTMLInputElement;
      expect(inAppInterviewCheckbox.checked).toBe(true);

      // Check push notifications master toggle
      const pushToggle = screen.getByLabelText(
        /enable push notifications/i
      ) as HTMLInputElement;
      expect(pushToggle.checked).toBe(false);
    });
  });

  // Test form submission
  it('should handle preference updates', async () => {
    (
      settingsService.notifications.updatePreferences as any
    ).mockResolvedValueOnce({
      error: null
    });

    render(<NotificationSettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    // Toggle some preferences
    fireEvent.click(screen.getByLabelText(/new podcast matches/i));
    fireEvent.click(screen.getByLabelText(/enable push notifications/i));

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify API call
    await waitFor(() => {
      expect(
        settingsService.notifications.updatePreferences
      ).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          email_notifications: expect.objectContaining({
            match_found: false
          }),
          push_notifications: expect.objectContaining({
            enabled: true
          })
        })
      );
    });

    // Check success message
    expect(
      screen.getByText(/notification preferences updated successfully/i)
    ).toBeInTheDocument();
  });

  // Test push notification support
  it('should handle push notification setup', async () => {
    // Mock browser push notification support
    Object.defineProperty(window, 'Notification', {
      value: class {
        static permission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('granted');
      }
    });

    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({
          pushManager: {
            subscribe: vi.fn().mockResolvedValue({
              endpoint: 'test-endpoint',
              keys: { auth: 'test-auth', p256dh: 'test-key' }
            })
          }
        })
      }
    });

    render(<NotificationSettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    // Enable push notifications
    fireEvent.click(screen.getByLabelText(/enable push notifications/i));

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify service worker registration and subscription
    await waitFor(() => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(
        settingsService.notifications.updatePushSubscription
      ).toHaveBeenCalled();
    });
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    const mockError = new Error('API Error');
    (
      settingsService.notifications.updatePreferences as any
    ).mockRejectedValueOnce(mockError);

    render(<NotificationSettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    // Make a change and submit
    fireEvent.click(screen.getByLabelText(/new podcast matches/i));
    fireEvent.click(screen.getByText('Save Changes'));

    // Check error message
    await waitFor(() => {
      expect(
        screen.getByText(/failed to update notification preferences/i)
      ).toBeInTheDocument();
    });
  });

  // Test form validation
  it('should disable submit button when no changes made', async () => {
    render(<NotificationSettings />);

    await waitFor(() => {
      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();
    });
  });
});

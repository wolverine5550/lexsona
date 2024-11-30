import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from '@testing-library/react';
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
      // Check email notifications using input name
      const emailMatchCheckbox = screen.getByLabelText(/new podcast matches/i, {
        selector: 'input[name="email_notifications.match_found"]'
      }) as HTMLInputElement;
      expect(emailMatchCheckbox.checked).toBe(true);

      // Check in-app notifications using input name
      const inAppInterviewCheckbox = screen.getByLabelText(
        /interview confirmations/i,
        {
          selector: 'input[name="in_app_notifications.interview_scheduled"]'
        }
      ) as HTMLInputElement;
      expect(inAppInterviewCheckbox.checked).toBe(true);

      // Check push notifications master toggle
      const pushToggle = screen.getByLabelText(/enable push notifications/i, {
        selector: 'input[name="push_notifications.enabled"]'
      }) as HTMLInputElement;
      expect(pushToggle.checked).toBe(false);
    });
  });

  // Test form submission
  it('should handle preference updates', async () => {
    // Mock successful API response
    const mockUpdatePreferences = vi.fn().mockResolvedValueOnce({
      data: { success: true },
      error: null
    });

    (settingsService.notifications.updatePreferences as any) =
      mockUpdatePreferences;

    render(<NotificationSettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    // Find and toggle email notification checkbox
    const emailMatchToggle = screen.getByLabelText(/new podcast matches/i, {
      selector: 'input[name="email_notifications.match_found"]'
    });
    fireEvent.click(emailMatchToggle);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Wait for the mock to be called
    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalled();
    });

    // Then check for success message
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        /notification preferences updated successfully/i
      );
    });
  });

  // Test push notification support
  it('should handle push notification toggle', async () => {
    // Mock push notification support
    const originalNotification = window.Notification;
    const mockPushSupported = true;

    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted')
      },
      writable: true
    });

    // Mock successful API response
    const mockUpdatePreferences = vi.fn().mockResolvedValueOnce({
      data: { success: true },
      error: null
    });

    // Set up the mock properly
    (settingsService.notifications.updatePreferences as any).mockImplementation(
      mockUpdatePreferences
    );

    render(<NotificationSettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    // Find and check push notification toggle
    const pushToggle = screen.getByLabelText(/enable push notifications/i);
    expect(pushToggle).toBeInTheDocument();
    expect(pushToggle).not.toBeDisabled(); // Should now be enabled
    expect(pushToggle).not.toBeChecked();

    // Toggle push notifications
    fireEvent.click(pushToggle);
    expect(pushToggle).toBeChecked();

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Check that preferences were updated
    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          push_notifications: expect.objectContaining({
            enabled: true
          })
        })
      );
    });

    // Cleanup
    Object.defineProperty(window, 'Notification', {
      value: originalNotification,
      writable: true
    });
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (
      settingsService.notifications.updatePreferences as any
    ).mockRejectedValueOnce(new Error('API Error'));

    render(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });

    // Find the email notifications checkbox by its label and role
    const emailMatchToggle = screen.getByLabelText(/new podcast matches/i, {
      selector: 'input[name="email_notifications.match_found"]'
    });
    fireEvent.click(emailMatchToggle);

    // Submit form and check error message
    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /save changes/i
      });
      expect(submitButton).not.toBeDisabled();
    });

    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        /failed to update notification preferences/i
      );
      expect(alert).toHaveClass('bg-red-50');
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

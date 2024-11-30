import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailPreferencesPage from '@/app/settings/email/page';
import { settingsService } from '@/services/settings/base';
import { useSession } from '@/hooks/useSession';

// Mock the session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn()
}));

// Mock the settings service
vi.mock('@/services/settings/base', () => ({
  settingsService: {
    email: {
      getPreferences: vi.fn(),
      updatePreferences: vi.fn()
    }
  }
}));

describe('EmailPreferencesPage', () => {
  // Mock user data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  // Mock initial preferences
  const mockPreferences = {
    email_enabled: true,
    frequency: 'daily',
    categories: {
      marketing: {
        enabled: true,
        frequency: 'weekly'
      },
      product_updates: {
        enabled: true,
        frequency: 'immediate'
      },
      security: {
        enabled: true,
        frequency: 'immediate'
      },
      activity: {
        enabled: true,
        frequency: 'daily'
      },
      recommendations: {
        enabled: true,
        frequency: 'weekly'
      }
    },
    time_preferences: {
      timezone: 'UTC',
      quiet_hours: {
        enabled: false
      },
      preferred_days: ['mon', 'tue', 'wed', 'thu', 'fri']
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: { user: mockUser } });
    (settingsService.email.getPreferences as any).mockResolvedValue({
      data: mockPreferences,
      error: null
    });
  });

  // Test loading state
  it('should show loading skeleton initially', () => {
    render(<EmailPreferencesPage />);
    expect(
      screen.getByTestId('email-preferences-skeleton')
    ).toBeInTheDocument();
  });

  // Test initial data loading
  it('should load and display existing preferences', async () => {
    render(<EmailPreferencesPage />);

    await waitFor(() => {
      // Check global settings
      const emailToggle = screen.getByLabelText(
        /enable email notifications/i
      ) as HTMLInputElement;
      expect(emailToggle.checked).toBe(true);

      // Check category settings
      const marketingToggle = screen.getByLabelText(
        /marketing & promotions/i
      ) as HTMLInputElement;
      expect(marketingToggle.checked).toBe(true);

      // Check frequency settings
      expect(screen.getByText('Daily Digest')).toBeInTheDocument();
    });
  });

  // Test form submission
  it('should handle preference updates', async () => {
    (settingsService.email.updatePreferences as any).mockResolvedValueOnce({
      error: null
    });

    render(<EmailPreferencesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Preferences')).toBeInTheDocument();
    });

    // Toggle some preferences
    fireEvent.click(screen.getByLabelText(/marketing & promotions/i));
    fireEvent.click(screen.getByLabelText(/show online status/i));

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify API call
    await waitFor(() => {
      expect(settingsService.email.updatePreferences).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          categories: expect.objectContaining({
            marketing: expect.objectContaining({
              enabled: false
            })
          })
        })
      );
    });

    // Check success message
    expect(
      screen.getByText(/email preferences updated successfully/i)
    ).toBeInTheDocument();
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    const mockError = new Error('API Error');
    (settingsService.email.updatePreferences as any).mockRejectedValueOnce(
      mockError
    );

    render(<EmailPreferencesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Email Preferences')).toBeInTheDocument();
    });

    // Make a change and submit
    fireEvent.click(screen.getByLabelText(/marketing & promotions/i));
    fireEvent.click(screen.getByText('Save Changes'));

    // Check error message
    await waitFor(() => {
      expect(
        screen.getByText(/failed to update email preferences/i)
      ).toBeInTheDocument();
    });
  });

  // Test form validation
  it('should disable submit button when no changes made', async () => {
    render(<EmailPreferencesPage />);

    await waitFor(() => {
      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();
    });
  });
});

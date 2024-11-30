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
      const emailToggle = screen.getByLabelText(/enable email notifications/i);
      expect(emailToggle).toBeChecked();

      // Check frequency select by its label
      const frequencySelect = screen.getByLabelText(/default frequency/i);
      expect(frequencySelect).toHaveValue('daily');
    });
  });

  // Test form submission
  it('should handle preference updates', async () => {
    // Mock successful API response
    (settingsService.email.updatePreferences as any).mockResolvedValueOnce({
      data: {},
      error: null
    });

    render(<EmailPreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText('Email Preferences')).toBeInTheDocument();
    });

    // Toggle preferences
    fireEvent.click(screen.getByLabelText(/marketing & promotions/i));
    fireEvent.click(screen.getByLabelText(/enable email notifications/i));

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Wait for and check success message
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        /email preferences updated successfully/i
      );
      expect(alert).toHaveClass('bg-green-50'); // Verify success styling
    });
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (settingsService.email.updatePreferences as any).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(<EmailPreferencesPage />);

    // Wait for initial load and form to be ready
    await waitFor(() => {
      expect(screen.getByText('Email Preferences')).toBeInTheDocument();
      expect(screen.getByLabelText(/marketing & promotions/i)).toBeChecked();
    });

    // Make changes to enable the submit button
    const emailToggle = screen.getByLabelText(/enable email notifications/i);
    const frequencySelect = screen.getByLabelText(/default frequency/i);

    // Toggle email notifications and change frequency
    fireEvent.click(emailToggle);
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });

    // Wait for form to be dirty and submit button to be enabled
    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /save changes/i
      });
      expect(submitButton).not.toBeDisabled();
    });

    // Submit form to trigger error
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Wait for and check error message
    await waitFor(
      () => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/failed to update email preferences/i);
        expect(alert).toHaveClass('bg-red-50'); // Verify error styling
      },
      {
        timeout: 3000 // Increase timeout to allow for state updates
      }
    );
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

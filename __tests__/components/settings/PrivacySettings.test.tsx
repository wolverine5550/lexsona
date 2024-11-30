import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PrivacySettings from '@/app/settings/privacy/page';
import { settingsService } from '@/services/settings/base';
import { useSession } from '@/hooks/useSession';

// Mock the session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn()
}));

// Mock the settings service
vi.mock('@/services/settings/base', () => ({
  settingsService: {
    privacy: {
      getSettings: vi.fn(),
      updateSettings: vi.fn()
    }
  }
}));

describe('PrivacySettings', () => {
  // Mock user data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  // Mock initial settings
  const mockSettings = {
    settings: {
      profile_visibility: {
        basic_info: 'public',
        contact_info: 'connections',
        expertise: 'public'
      },
      discovery: {
        show_in_search: true,
        allow_recommendations: true,
        show_online_status: true
      },
      communication: {
        allow_messages: 'connections',
        allow_connection_requests: true,
        show_read_receipts: true
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: { user: mockUser } });
    (settingsService.privacy.getSettings as any).mockResolvedValue({
      data: mockSettings,
      error: null
    });
  });

  // Test loading state
  it('should show loading skeleton initially', () => {
    render(<PrivacySettings />);
    expect(screen.getByTestId('privacy-settings-skeleton')).toBeInTheDocument();
  });

  // Test initial data loading
  it('should load and display existing settings', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      // Check profile visibility settings
      const basicInfoRadio = screen.getByLabelText(
        /everyone/i
      ) as HTMLInputElement;
      expect(basicInfoRadio.checked).toBe(true);

      // Check discovery settings
      const searchToggle = screen.getByLabelText(
        /show in search results/i
      ) as HTMLInputElement;
      expect(searchToggle.checked).toBe(true);

      // Check communication settings
      const messagePermissions = screen.getByLabelText(/my connections/i, {
        exact: false
      }) as HTMLInputElement;
      expect(messagePermissions.checked).toBe(true);
    });
  });

  // Test form submission
  it('should handle settings updates', async () => {
    (settingsService.privacy.updateSettings as any).mockResolvedValueOnce({
      error: null
    });

    render(<PrivacySettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    });

    // Change some settings
    fireEvent.click(screen.getByLabelText(/only me/i));
    fireEvent.click(screen.getByLabelText(/show online status/i));

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify API call
    await waitFor(() => {
      expect(settingsService.privacy.updateSettings).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          profile_visibility: expect.objectContaining({
            basic_info: 'private'
          }),
          discovery: expect.objectContaining({
            show_online_status: false
          })
        })
      );
    });

    // Check success message
    expect(
      screen.getByText(/privacy settings updated successfully/i)
    ).toBeInTheDocument();
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    const mockError = new Error('API Error');
    (settingsService.privacy.updateSettings as any).mockRejectedValueOnce(
      mockError
    );

    render(<PrivacySettings />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    });

    // Make a change and submit
    fireEvent.click(screen.getByLabelText(/only me/i));
    fireEvent.click(screen.getByText('Save Changes'));

    // Check error message
    await waitFor(() => {
      expect(
        screen.getByText(/failed to update privacy settings/i)
      ).toBeInTheDocument();
    });
  });

  // Test form validation
  it('should disable submit button when no changes made', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();
    });
  });

  // Test accessibility
  it('should have proper ARIA labels and roles', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      // Check form accessibility
      expect(screen.getByRole('form')).toHaveAttribute(
        'aria-label',
        'Privacy Settings Form'
      );

      // Check radio group accessibility
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby');

      // Check toggle accessibility
      const toggles = screen.getAllByRole('checkbox');
      toggles.forEach((toggle) => {
        expect(toggle).toHaveAttribute('aria-describedby');
      });
    });
  });
});

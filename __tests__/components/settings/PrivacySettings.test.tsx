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
    profile_visibility: {
      basic_info: 'public',
      contact_info: 'private',
      expertise: 'connections'
    },
    discovery: {
      show_in_search: true,
      allow_recommendations: true,
      show_online_status: false
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
    const skeleton = screen.getByTestId('privacy-settings-skeleton');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  // Test initial data loading
  it('should load and display existing settings', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      // Check profile visibility settings
      const basicInfoRadio = screen.getByLabelText(/everyone/i, {
        selector: 'input[name="profile_visibility.basic_info"][value="public"]'
      }) as HTMLInputElement;
      expect(basicInfoRadio.checked).toBe(true);

      // Check discovery settings
      const searchToggle = screen.getByLabelText(
        /show in search results/i
      ) as HTMLInputElement;
      expect(searchToggle.checked).toBe(true);
    });
  });

  // Test form submission
  it('should handle settings updates', async () => {
    // Mock successful API response
    (settingsService.privacy.updateSettings as any).mockResolvedValueOnce({
      data: {},
      error: null
    });

    render(<PrivacySettings />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    });

    // Change basic info visibility
    const privateRadio = screen.getByLabelText(/only me/i, {
      selector: 'input[name="profile_visibility.basic_info"][value="private"]'
    });
    fireEvent.click(privateRadio);

    // Toggle search visibility
    const searchToggle = screen.getByLabelText(/show in search results/i);
    fireEvent.click(searchToggle);

    // Wait for form to be dirty
    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /save changes/i
      });
      expect(submitButton).not.toBeDisabled();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Check success message
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/privacy settings updated successfully/i);
      expect(alert).toHaveClass('bg-green-50');
    });
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (settingsService.privacy.updateSettings as any).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(<PrivacySettings />);

    await waitFor(() => {
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
    });

    // Change basic info visibility
    const privateRadio = screen.getByLabelText(/only me/i, {
      selector: 'input[name="profile_visibility.basic_info"][value="private"]'
    });
    fireEvent.click(privateRadio);

    // Wait for form to be dirty
    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /save changes/i
      });
      expect(submitButton).not.toBeDisabled();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(submitButton);

    // Check error message
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/failed to update privacy settings/i);
      expect(alert).toHaveClass('bg-red-50');
    });
  });

  // Test form validation
  it('should disable submit button when no changes made', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      const submitButton = screen.getByRole('button', {
        name: /save changes/i
      });
      expect(submitButton).toBeDisabled();
    });
  });

  // Test accessibility
  it('should have proper ARIA labels and roles', async () => {
    render(<PrivacySettings />);

    await waitFor(() => {
      expect(
        screen.getByRole('form', { name: /privacy settings/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radiogroup', { name: /basic information/i })
      ).toBeInTheDocument();
    });
  });
});

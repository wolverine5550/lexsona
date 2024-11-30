import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { settingsService } from '@/services/settings/base';
import { useSession } from '@/hooks/useSession';

// Mock the session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn()
}));

// Mock the settings service
vi.mock('@/services/settings/base', () => ({
  settingsService: {
    profile: {
      getProfile: vi.fn(),
      updateProfile: vi.fn()
    }
  }
}));

describe('ProfileSettings', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: { user: mockUser } });
    // Mock successful initial profile load
    (settingsService.profile.getProfile as any).mockResolvedValue({
      data: {
        name: '',
        bio: '',
        location: '',
        expertise: []
      },
      error: null
    });
  });

  it('should render the form with all fields', async () => {
    render(<ProfileSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByTestId('profile-settings-skeleton')
      ).not.toBeInTheDocument();
    });

    // Check for required fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<ProfileSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    // Submit empty form
    const form = screen.getByRole('form');
    await fireEvent.submit(form);

    // Check for validation errors
    await waitFor(() => {
      expect(
        screen.getByText('Name must be at least 2 characters')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please select at least one area of expertise')
      ).toBeInTheDocument();
    });
  });

  it('should handle successful profile update', async () => {
    // Mock successful update
    (settingsService.profile.updateProfile as any).mockResolvedValueOnce({
      error: null
    });

    render(<ProfileSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill out form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });

    // Select expertise using the proper ID
    fireEvent.click(
      screen.getByLabelText(/react/i, {
        selector: 'input[type="checkbox"]'
      })
    );

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify success message
    await waitFor(() => {
      expect(
        screen.getByText(/profile updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    // Mock API error
    (settingsService.profile.updateProfile as any).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(<ProfileSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });

    // Select expertise using the proper ID
    fireEvent.click(
      screen.getByLabelText(/react/i, {
        selector: 'input[type="checkbox"]'
      })
    );

    fireEvent.click(screen.getByText('Save Changes'));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });
});

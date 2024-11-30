import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileSettings from '@/app/settings/profile/page';
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
  const mockSession = {
    user: {
      id: 'test-user-id'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: mockSession });
    (settingsService.profile.getProfile as any).mockResolvedValue({
      data: null,
      error: null
    });
  });

  it('should render the form with all fields', () => {
    render(<ProfileSettings />);

    // Check for required fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/professional title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByText(/areas of expertise/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/twitter handle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/linkedin profile/i)).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    render(<ProfileSettings />);

    // Submit empty form
    fireEvent.click(screen.getByText('Save Changes'));

    // Check for validation errors
    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/select at least one area of expertise/i)
      ).toBeInTheDocument();
    });
  });

  it('should load existing profile data', async () => {
    const mockProfile = {
      name: 'John Doe',
      bio: 'Test bio',
      expertise: ['Technology', 'Business']
    };

    (settingsService.profile.getProfile as any).mockResolvedValueOnce({
      data: mockProfile,
      error: null
    });

    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
      const techCheckbox = screen.getByLabelText(
        'Technology'
      ) as HTMLInputElement;
      expect(techCheckbox.checked).toBe(true);
    });
  });

  it('should handle successful profile update', async () => {
    (settingsService.profile.updateProfile as any).mockResolvedValueOnce({
      error: null
    });

    render(<ProfileSettings />);

    // Fill out form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.click(screen.getByLabelText('Technology'));

    // Submit form
    fireEvent.click(screen.getByText('Save Changes'));

    // Check for success message
    await waitFor(() => {
      expect(
        screen.getByText(/profile updated successfully/i)
      ).toBeInTheDocument();
    });

    // Verify API call
    expect(settingsService.profile.updateProfile).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({
        name: 'John Doe',
        expertise: ['Technology']
      })
    );
  });

  it('should handle API errors', async () => {
    (settingsService.profile.updateProfile as any).mockResolvedValueOnce({
      error: new Error('API Error')
    });

    render(<ProfileSettings />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.click(screen.getByLabelText('Technology'));
    fireEvent.click(screen.getByText('Save Changes'));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });
});

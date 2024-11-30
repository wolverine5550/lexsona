import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AccountSettings from '@/app/settings/account/page';
import { settingsService } from '@/services/settings/base';
import { useSession } from '@/hooks/useSession';

// Mock the session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: vi.fn()
}));

// Mock the settings service
vi.mock('@/services/settings/base', () => ({
  settingsService: {
    account: {
      updatePassword: vi.fn(),
      resendVerification: vi.fn(),
      deleteAccount: vi.fn(),
      getSessions: vi.fn()
    }
  }
}));

describe('AccountSettings', () => {
  // Mock user data
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    email_verified: false
  };

  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: { user: mockUser } });
  });

  // Test loading state
  it('should show loading skeleton initially', () => {
    render(<AccountSettings />);

    // Verify loading skeletons are present
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  // Test email verification
  it('should handle email verification resend', async () => {
    (settingsService.account.resendVerification as any).mockResolvedValueOnce({
      error: null
    });

    render(<AccountSettings />);

    // Click resend verification button
    const resendButton = screen.getByText(/resend verification/i);
    fireEvent.click(resendButton);

    // Verify loading state
    expect(resendButton).toBeDisabled();
    expect(screen.getByText('Sending...')).toBeInTheDocument();

    // Verify success message
    await waitFor(() => {
      expect(
        screen.getByText(/verification email sent successfully/i)
      ).toBeInTheDocument();
    });
  });

  // Test password change
  it('should handle password change with confirmation', async () => {
    (settingsService.account.updatePassword as any).mockResolvedValueOnce({
      error: null
    });

    render(<AccountSettings />);

    // Fill password form
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass123' }
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'Newpass123!' }
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'Newpass123!' }
    });

    // Submit form
    fireEvent.click(screen.getByText('Update Password'));

    // Verify confirmation modal appears
    expect(
      screen.getByText(/you will be logged out of all other devices/i)
    ).toBeInTheDocument();

    // Confirm password change
    fireEvent.click(screen.getByText('Change Password'));

    // Verify loading and success states
    await waitFor(() => {
      expect(
        screen.getByText(/password updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  // Test account deletion
  it('should handle account deletion with confirmation', async () => {
    (settingsService.account.deleteAccount as any).mockResolvedValueOnce({
      error: null
    });

    const { container } = render(<AccountSettings />);

    // Click delete account button
    fireEvent.click(screen.getByText('Delete Account'));

    // Verify confirmation modal appears
    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument();

    // Confirm deletion
    fireEvent.click(
      screen.getByText(/delete account/i, { selector: 'button' })
    );

    // Verify loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();

    // Verify redirect
    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    // Mock API error
    const mockError = new Error('API Error');
    (settingsService.account.updatePassword as any).mockRejectedValueOnce(
      mockError
    );

    render(<AccountSettings />);

    // Submit password form
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass123' }
    });
    fireEvent.click(screen.getByText('Update Password'));

    // Verify error message
    await waitFor(() => {
      expect(
        screen.getByText(/failed to update password/i)
      ).toBeInTheDocument();
    });
  });

  // Test validation
  it('should validate password requirements', async () => {
    render(<AccountSettings />);

    // Submit empty form
    fireEvent.click(screen.getByText('Update Password'));

    // Verify validation errors
    await waitFor(() => {
      expect(
        screen.getByText(/current password is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });
  });
});

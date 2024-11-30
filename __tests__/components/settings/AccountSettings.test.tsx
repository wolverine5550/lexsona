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

  // Mock session data
  const mockSessions = [
    {
      id: 'session-1',
      created_at: '2024-01-01',
      last_active: '2024-01-02',
      user_agent: 'Chrome',
      current: true
    }
  ];

  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as any).mockReturnValue({ session: { user: mockUser } });

    // Mock session service with proper data structure
    (settingsService.account.getSessions as any).mockResolvedValue({
      data: mockSessions,
      error: null
    });
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
    // Mock successful API response
    (settingsService.account.resendVerification as any).mockResolvedValueOnce({
      error: null
    });

    render(<AccountSettings />);

    // Wait for the content to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Click resend verification button
    const resendButton = screen.getByRole('button', {
      name: /resend verification/i
    });
    fireEvent.click(resendButton);

    // Verify loading state
    expect(resendButton).toBeDisabled();
    expect(resendButton).toHaveTextContent(/sending/i);

    // Verify success message
    await waitFor(() => {
      expect(
        screen.getByText(/verification email sent successfully/i)
      ).toBeInTheDocument();
    });
  });

  // Test password change
  it('should handle password change with confirmation', async () => {
    // Mock successful API response
    (settingsService.account.updatePassword as any).mockResolvedValueOnce({
      error: null
    });

    render(<AccountSettings />);

    // Wait for the content to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Fill password form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit form
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Verify success message
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

    render(<AccountSettings />);

    // Wait for the content to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });

    // Click delete account button in the main page
    const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
    fireEvent.click(deleteButton);

    // Wait for modal and confirm
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Find the confirm button in the modal
    const buttons = screen.getAllByRole('button', { name: /delete account/i });
    const confirmButton = buttons.find((button) =>
      button.classList.contains('bg-red-600')
    );
    fireEvent.click(confirmButton!);

    // Wait for and verify loading state
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', {
        name: /delete account|deleting\.\.\./i
      });
      expect(
        deleteButtons.some((button) => button.hasAttribute('disabled'))
      ).toBe(true);
    });

    // Verify redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
  });

  // Test error handling
  it('should handle API errors gracefully', async () => {
    // Mock API error
    const mockError = new Error('API Error');
    (settingsService.account.updatePassword as any).mockRejectedValueOnce(
      mockError
    );

    // Mock session service
    (settingsService.account.getSessions as any).mockResolvedValueOnce({
      data: [],
      error: null
    });

    render(<AccountSettings />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    // Fill out the form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });

    // Submit form
    const updateButton = screen.getByRole('button', {
      name: /update password/i
    });
    fireEvent.click(updateButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(/failed to update password/i)
      ).toBeInTheDocument();
    });
  });

  // Test validation
  it('should validate password requirements', async () => {
    render(<AccountSettings />);

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    // Submit empty form
    const updateButton = screen.getByRole('button', {
      name: /update password/i
    });
    fireEvent.click(updateButton);

    // Verify validation errors
    await waitFor(() => {
      // Check for error messages
      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages).toHaveLength(3); // One for each field
      expect(errorMessages[0]).toHaveTextContent(
        /current password is required/i
      );
      expect(errorMessages[1]).toHaveTextContent(/new password is required/i);
      expect(errorMessages[2]).toHaveTextContent(
        /password confirmation is required/i
      );
    });
  });
});

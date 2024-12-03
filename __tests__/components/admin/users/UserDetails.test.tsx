import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserDetails } from '@/components/admin/users/UserDetails';

describe('UserDetails Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    role: 'admin' as const,
    status: 'active' as const,
    created_at: new Date().toISOString(),
    last_sign_in: new Date().toISOString()
  };

  const mockOnUpdate = vi.fn().mockResolvedValue(true);

  // Rendering tests
  describe('Rendering', () => {
    it('should render user details', () => {
      render(<UserDetails user={mockUser} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Last Sign In')).toBeInTheDocument();
    });

    it('should render all role options', () => {
      render(<UserDetails user={mockUser} onUpdate={mockOnUpdate} />);

      expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Staff' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'User' })).toBeInTheDocument();
    });

    it('should render all status options', () => {
      render(<UserDetails user={mockUser} onUpdate={mockOnUpdate} />);

      expect(
        screen.getByRole('button', { name: 'Active' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Inactive' })
      ).toBeInTheDocument();
    });

    it('should highlight current role and status', () => {
      render(<UserDetails user={mockUser} onUpdate={mockOnUpdate} />);

      const adminButton = screen.getByRole('button', { name: 'Admin' });
      const activeButton = screen.getByRole('button', { name: 'Active' });

      expect(adminButton).toHaveAttribute('data-variant', 'flat');
      expect(activeButton).toHaveAttribute('data-variant', 'flat');
    });
  });

  // Update tests
  describe('Updates', () => {
    it('should handle role updates', async () => {
      render(<UserDetails user={mockUser} onUpdate={mockOnUpdate} />);

      const staffButton = screen.getByRole('button', { name: 'Staff' });
      fireEvent.click(staffButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(mockUser.id, { role: 'staff' });
    });

    it('should handle status updates', async () => {
      render(<UserDetails user={mockUser} onUpdate={mockOnUpdate} />);

      const inactiveButton = screen.getByRole('button', { name: 'Inactive' });
      fireEvent.click(inactiveButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(mockUser.id, {
        status: 'inactive'
      });
    });

    it('should show loading state during updates', async () => {
      // Mock a delayed update
      const delayedUpdate = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
        );

      render(<UserDetails user={mockUser} onUpdate={delayedUpdate} />);

      const staffButton = screen.getByRole('button', { name: 'Staff' });
      fireEvent.click(staffButton);

      // Look for the loading spinner
      expect(await screen.findByTestId('loading-spinner')).toBeInTheDocument();
      expect(staffButton).toBeDisabled();
    });

    it('should disable all buttons during update', async () => {
      const delayedUpdate = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
        );

      render(<UserDetails user={mockUser} onUpdate={delayedUpdate} />);

      fireEvent.click(screen.getByRole('button', { name: 'Staff' }));

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  // Time formatting tests
  describe('Time Formatting', () => {
    it('should format join date correctly', () => {
      const recentDate = new Date();
      const user = {
        ...mockUser,
        created_at: recentDate.toISOString()
      };

      render(<UserDetails user={user} onUpdate={mockOnUpdate} />);

      expect(
        screen.getByText(/joined less than a minute ago/i)
      ).toBeInTheDocument();
    });

    it('should format last sign in date correctly', () => {
      const recentDate = new Date();
      const user = {
        ...mockUser,
        last_sign_in: recentDate.toISOString()
      };

      render(<UserDetails user={user} onUpdate={mockOnUpdate} />);

      const lastSignInSection = screen.getByText('Last Sign In').parentElement;
      expect(lastSignInSection?.querySelector('p')).toHaveTextContent(
        /less than a minute ago/i
      );
    });

    it('should handle missing last sign in date', () => {
      const user = {
        ...mockUser,
        last_sign_in: undefined
      };

      render(<UserDetails user={user} onUpdate={mockOnUpdate} />);

      expect(screen.queryByText('Last Sign In')).not.toBeInTheDocument();
    });
  });
});

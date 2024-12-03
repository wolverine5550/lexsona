import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserCreationModal } from '@/components/admin/users/UserCreationModal';
import { createClient } from '@/utils/supabase/client';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn()
    },
    from: vi.fn()
  }))
}));

describe('UserCreationModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnUserCreated = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onUserCreated: mockOnUserCreated
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering tests
  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<UserCreationModal {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<UserCreationModal {...defaultProps} />);

      expect(screen.getByText(/cancel/i)).toBeInTheDocument();
      expect(screen.getByText(/create user/i)).toBeInTheDocument();
    });
  });

  // Form validation tests
  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(<UserCreationModal {...defaultProps} />);

      fireEvent.click(screen.getByText(/create user/i));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        expect(
          screen.getByText(/please confirm password/i)
        ).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<UserCreationModal {...defaultProps} />);

      // Start with empty form
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /create user/i });

      // Fill in password fields to avoid those validations
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });

      // Type invalid email and immediately submit
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: 'invalid-email' }
        });
        fireEvent.submit(emailInput.closest('form')!);
      });

      // Wait for and verify the error message
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/invalid email format/i);
        expect(errorMessages.length).toBeGreaterThan(0);
        expect(errorMessages[0]).toHaveClass('text-red-500');
      });
    });

    it('should validate password match', async () => {
      render(<UserCreationModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password456' }
      });
      fireEvent.click(screen.getByText(/create user/i));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  // Form submission tests
  describe('Form Submission', () => {
    it('should handle successful user creation', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        status: 'active'
      };

      // Create mock functions for the Supabase chain
      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: { id: '123' } },
        error: null
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect
      });

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      });

      // Mock the Supabase client
      vi.mocked(createClient).mockReturnValue({
        auth: {
          signUp: mockSignUp
        },
        from: mockFrom
      } as any);

      render(<UserCreationModal {...defaultProps} />);

      // Fill in form fields
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByText(/create user/i));

      // Wait for and verify callbacks
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(mockInsert).toHaveBeenCalledWith([
          {
            id: '123',
            email: 'test@example.com',
            role: 'user',
            status: 'active'
          }
        ]);
        expect(mockOnUserCreated).toHaveBeenCalledWith(mockUser);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle creation error', async () => {
      // Create mock functions for the Supabase chain
      const mockSignUp = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to create user account' }
      });

      // Mock the Supabase client
      vi.mocked(createClient).mockReturnValue({
        auth: {
          signUp: mockSignUp
        },
        from: vi.fn()
      } as any);

      render(<UserCreationModal {...defaultProps} />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByText(/create user/i));

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to create user account/i)
        ).toBeInTheDocument();
        expect(mockOnUserCreated).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('should close modal when cancel is clicked', () => {
      render(<UserCreationModal {...defaultProps} />);

      fireEvent.click(screen.getByText(/cancel/i));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should clear errors when user starts typing', async () => {
      render(<UserCreationModal {...defaultProps} />);

      // Trigger validation errors
      fireEvent.click(screen.getByText(/create user/i));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 't' }
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/email is required/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});

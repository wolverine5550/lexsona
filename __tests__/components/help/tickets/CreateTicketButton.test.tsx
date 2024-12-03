import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTicketButton } from '@/components/help/tickets/CreateTicketButton';
import { createClient } from '@/utils/supabase/client';
import { Dialog } from '@/components/ui/Dialog';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: { id: 'test-user-id' }
      }
    })
  },
  from: vi.fn().mockReturnValue({
    insert: vi.fn().mockResolvedValue({
      error: null
    })
  })
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Dialog>{children}</Dialog>;
};

// Custom render function
const customRender = (ui: React.ReactElement) => {
  return render(ui, {
    wrapper: TestWrapper
  });
};

describe('CreateTicketButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null })
    });
  });

  // Rendering tests
  describe('Rendering', () => {
    it('should render create ticket button', () => {
      customRender(<CreateTicketButton />);
      expect(screen.getByText('Create Ticket')).toBeInTheDocument();
    });

    it('should show dialog when button is clicked', async () => {
      customRender(<CreateTicketButton />);

      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(screen.getByText('Create Support Ticket')).toBeInTheDocument();
        expect(
          screen.getByText("Describe your issue and we'll help you resolve it.")
        ).toBeInTheDocument();
      });
    });

    it('should render form fields correctly', async () => {
      customRender(<CreateTicketButton />);

      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });
    });
  });

  // Form interaction tests
  describe('Form Interactions', () => {
    it('should handle form submission correctly', async () => {
      customRender(<CreateTicketButton />);

      // Open dialog
      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Issue' }
      });
      fireEvent.change(screen.getByLabelText(/category/i), {
        target: { value: 'technical' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test description' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      customRender(<CreateTicketButton />);

      // Open dialog
      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Issue' }
      });
      fireEvent.change(screen.getByLabelText(/category/i), {
        target: { value: 'technical' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test description' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('should close dialog when cancel is clicked', async () => {
      customRender(<CreateTicketButton />);

      // Open dialog
      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      // Click cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Check if dialog is closed
      await waitFor(() => {
        expect(
          screen.queryByText('Create Support Ticket')
        ).not.toBeInTheDocument();
      });
    });
  });

  // Validation tests
  describe('Form Validation', () => {
    it('should require all fields', async () => {
      customRender(<CreateTicketButton />);

      // Open dialog
      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Create Ticket' })
        ).toBeInTheDocument();
      });

      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

      // Check if form validation prevents submission
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
        const categoryInput = screen.getByLabelText(
          /category/i
        ) as HTMLSelectElement;
        const descriptionInput = screen.getByLabelText(
          /description/i
        ) as HTMLTextAreaElement;

        expect(titleInput.validity.valid).toBe(false);
        expect(categoryInput.validity.valid).toBe(false);
        expect(descriptionInput.validity.valid).toBe(false);
      });
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Override the mock for this test
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Test error', code: 'TEST_ERROR' }
        })
      });

      customRender(<CreateTicketButton />);

      // Open dialog
      fireEvent.click(screen.getByText('Create Ticket'));

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      });

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Issue' }
      });
      fireEvent.change(screen.getByLabelText(/category/i), {
        target: { value: 'technical' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Test description' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'Create Ticket' }));

      // Verify error handling
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Error creating ticket:',
          expect.objectContaining({
            message: 'Test error',
            code: 'TEST_ERROR'
          })
        );
      });

      consoleError.mockRestore();
    });
  });
});

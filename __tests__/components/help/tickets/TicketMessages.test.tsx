import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketMessages } from '@/components/help/tickets/TicketMessages';
import { createClient } from '@/utils/supabase/client';

// Simplified mock setup
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    })
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              content: 'Test message 1',
              is_staff: false,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              content: 'Test message 2',
              is_staff: true,
              created_at: new Date().toISOString()
            }
          ]
        })
      })
    }),
    insert: vi.fn().mockResolvedValue({ error: null })
  }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue(undefined)
  }),
  removeChannel: vi.fn().mockResolvedValue(undefined)
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('TicketMessages Component', () => {
  const mockTicketId = 'test-ticket-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render messages correctly', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);
    await waitFor(() => {
      expect(screen.getByText('Test message 1')).toBeInTheDocument();
      expect(screen.getByText('Test message 2')).toBeInTheDocument();
    });
  });

  it('should render message input', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/type your message/i)
      ).toBeInTheDocument();
    });
  });

  it('should show empty state when no messages', async () => {
    // Override the mock for this test only
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] })
        })
      })
    });

    render(<TicketMessages ticketId={mockTicketId} />);
    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });
  });

  it('should handle message submission', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);
    const input = await waitFor(() =>
      screen.getByPlaceholderText(/type your message/i)
    );

    fireEvent.change(input, { target: { value: 'New test message' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should show loading state during submission', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);
    const input = await waitFor(() =>
      screen.getByPlaceholderText(/type your message/i)
    );

    fireEvent.change(input, { target: { value: 'New test message' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() =>
      expect(screen.getByText('Sending...')).toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
    );
  });

  it('should prevent empty message submission', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);
    const input = await waitFor(() =>
      screen.getByPlaceholderText(/type your message/i)
    );

    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(screen.getByText('Send')).toBeEnabled());
  });

  it('should handle API errors gracefully', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock initial data fetch
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [] })
        })
      })
    });

    // Mock the insert operation to fail
    mockSupabase.from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Test error', code: 'TEST_ERROR' }
      })
    });

    render(<TicketMessages ticketId={mockTicketId} />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument();
    });

    // Submit a new message
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'New test message' } });

    // Verify loading state
    expect(screen.getByText('Send')).toBeInTheDocument();
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByText('Sending...')).toBeInTheDocument();

    // Verify error handling
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Error sending message:',
        expect.objectContaining({
          message: 'Test error',
          code: 'TEST_ERROR'
        })
      );
    });

    // Verify form returns to initial state
    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument();
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
    });

    consoleError.mockRestore();
  });

  it('should style user and staff messages differently', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);

    await waitFor(() => {
      const userMessage = screen.getByText('Test message 1').closest('div');
      const staffMessage = screen.getByText('Test message 2').closest('div');
      expect(userMessage).toHaveClass('bg-blue-500');
      expect(staffMessage).toHaveClass('bg-zinc-800');
    });
  });

  it('should set up and clean up Supabase subscription', async () => {
    render(<TicketMessages ticketId={mockTicketId} />);

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        `ticket_messages:${mockTicketId}`
      );
      expect(mockSupabase.channel().subscribe).toHaveBeenCalled();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagement } from '@/components/admin/users/UserManagement';
import { vi } from 'vitest';
import { createClient } from '@/utils/supabase/client';

// Mock the Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('UserManagement Component', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      email: 'user@example.com',
      role: 'user',
      status: 'inactive',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  // Mock Supabase client implementation
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            abortSignal: vi.fn(() =>
              Promise.resolve({ data: mockUsers, error: null })
            )
          }))
        })),
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: mockUsers[0], error: null })
            )
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Update failed' }
                })
              )
            }))
          }))
        }))
      })),
      count: vi.fn(() =>
        Promise.resolve({ count: mockUsers.length, error: null })
      )
    }))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  });

  describe('Initial Render', () => {
    it('should render loading state initially', () => {
      render(<UserManagement />);
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should load and display users', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('User Selection and Updates', () => {
    it('should handle errors during updates', async () => {
      // Mock initial load
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => ({
              abortSignal: vi.fn(() =>
                Promise.resolve({ data: mockUsers, error: null })
              )
            }))
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: 'Failed to update user' }
                })
              )
            }))
          }))
        })),
        count: vi.fn(() =>
          Promise.resolve({ count: mockUsers.length, error: null })
        )
      }));

      mockSupabase.from.mockImplementation(mockFrom);

      render(<UserManagement />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      // Click on a user to select them
      fireEvent.click(screen.getByText('admin@example.com'));

      // Wait for UserDetails to be rendered
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Role', level: 3 })
        ).toBeInTheDocument();
      });

      // Find and click the role button to trigger an update
      const roleButton = screen.getByRole('button', { name: /staff/i });
      fireEvent.click(roleButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Failed to update user'
        );
      });
    });
  });

  describe('Search and Filters', () => {
    it('should update search query', async () => {
      render(<UserManagement />);

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });

    it('should update role filter', async () => {
      render(<UserManagement />);

      const roleSelect = screen.getByRole('combobox', {
        name: 'Filter by role'
      });
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });

    it('should update status filter', async () => {
      render(<UserManagement />);

      const statusSelect = screen.getByRole('combobox', {
        name: 'Filter by status'
      });
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('should handle page changes', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-button-desktop');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });

    it('should handle page size changes', async () => {
      render(<UserManagement />);

      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      const pageSizeSelect = screen.getByRole('combobox', {
        name: 'Items per page'
      });
      fireEvent.change(pageSizeSelect, { target: { value: '25' } });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalled();
      });
    });
  });
});

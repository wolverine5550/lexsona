import { render, screen, fireEvent } from '@testing-library/react';
import { UserList } from '@/components/admin/users/UserList';
import { vi } from 'vitest';
import type { User } from '@/components/admin/users/UserManagement';

describe('UserList', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      role: 'admin' as const,
      status: 'active' as const,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      email: 'user@example.com',
      role: 'user' as const,
      status: 'inactive' as const,
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockOnUserSelect = vi.fn();
  const mockOnPageChange = vi.fn();
  const mockOnPageSizeChange = vi.fn();
  const mockOnSort = vi.fn();
  const mockOnUserSelectionChange = vi.fn();
  const mockOnSelectAllChange = vi.fn();

  const defaultProps = {
    users: mockUsers,
    isLoading: false,
    onUserSelect: mockOnUserSelect,
    page: 1,
    pageSize: 10,
    totalUsers: 2,
    onPageChange: mockOnPageChange,
    onPageSizeChange: mockOnPageSizeChange,
    sortBy: 'created_at' as const,
    sortDirection: 'desc' as const,
    onSort: mockOnSort,
    selectedUserIds: [] as string[],
    onUserSelectionChange: mockOnUserSelectionChange,
    onSelectAllChange: mockOnSelectAllChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    render(<UserList {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(<UserList {...defaultProps} users={[]} />);
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('should render user list', () => {
    render(<UserList {...defaultProps} />);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('should render user roles with correct styling', () => {
    render(<UserList {...defaultProps} />);

    // Find badges by their unique class combinations
    const adminBadge = screen.getByText('Admin', {
      selector: '.bg-purple-500\\/10'
    });
    const userBadge = screen.getByText('User', {
      selector: '.bg-green-500\\/10'
    });

    expect(adminBadge).toHaveClass('bg-purple-500/10', 'text-purple-500');
    expect(userBadge).toHaveClass('bg-green-500/10', 'text-green-500');
  });

  it('should render user status with correct styling', () => {
    render(<UserList {...defaultProps} />);
    const activeBadge = screen.getByText('Active');
    const inactiveBadge = screen.getByText('Inactive');

    expect(activeBadge).toHaveClass('bg-green-500/10', 'text-green-500');
    expect(inactiveBadge).toHaveClass('bg-red-500/10', 'text-red-500');
  });

  it('should handle user selection', () => {
    render(<UserList {...defaultProps} />);
    fireEvent.click(screen.getByText('admin@example.com'));
    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('should highlight selected user', () => {
    render(<UserList {...defaultProps} selectedUserId="1" />);
    const userRow = screen.getByText('admin@example.com').closest('tr');
    expect(userRow).toHaveClass('bg-zinc-800');
  });

  it('should handle bulk selection', () => {
    render(<UserList {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');

    // Click individual user checkbox
    fireEvent.click(checkboxes[1]); // First user checkbox (after select all)
    expect(mockOnUserSelectionChange).toHaveBeenCalledWith('1', true);
  });

  it('should handle select all', () => {
    render(<UserList {...defaultProps} />);
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];

    fireEvent.click(selectAllCheckbox);
    expect(mockOnSelectAllChange).toHaveBeenCalledWith(true);
  });

  it('should show selected state for checked users', () => {
    render(<UserList {...defaultProps} selectedUserIds={['1']} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).toBeChecked(); // First user checkbox
    expect(checkboxes[2]).not.toBeChecked(); // Second user checkbox
  });

  it('should show indeterminate state when some users are selected', () => {
    render(
      <UserList
        {...defaultProps}
        selectedUserIds={['1']} // Only first user selected
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    expect(selectAllCheckbox).toHaveClass('data-[state=checked]:bg-indigo-500');
  });

  it('should handle sorting', () => {
    render(<UserList {...defaultProps} />);

    // Find the header button by its role and name
    const emailHeader = screen.getByRole('button', {
      name: 'Sort by user'
    });

    fireEvent.click(emailHeader);
    expect(mockOnSort).toHaveBeenCalledWith('email');
  });

  it('should handle pagination', () => {
    render(<UserList {...defaultProps} totalUsers={25} />);

    const nextButtonDesktop = screen.getByTestId('next-button-desktop');
    fireEvent.click(nextButtonDesktop);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('should handle page size change', () => {
    render(<UserList {...defaultProps} />);

    const pageSizeSelect = screen.getByRole('combobox');
    fireEvent.change(pageSizeSelect, { target: { value: '25' } });
    expect(mockOnPageSizeChange).toHaveBeenCalledWith(25);
  });

  it('should show correct pagination info', () => {
    render(
      <UserList {...defaultProps} totalUsers={100} page={2} pageSize={10} />
    );

    const paginationText = screen.getByText(/showing/i);
    expect(paginationText).toHaveTextContent('Showing 11 to 20 of 100 results');
  });

  it('should disable pagination buttons when at limits', () => {
    render(
      <UserList {...defaultProps} page={1} totalUsers={10} pageSize={10} />
    );

    const prevButtonMobile = screen.getByTestId('prev-button-mobile');
    const nextButtonMobile = screen.getByTestId('next-button-mobile');
    const prevButtonDesktop = screen.getByTestId('prev-button-desktop');
    const nextButtonDesktop = screen.getByTestId('next-button-desktop');

    expect(prevButtonMobile).toBeDisabled();
    expect(nextButtonMobile).toBeDisabled();
    expect(prevButtonDesktop).toBeDisabled();
    expect(nextButtonDesktop).toBeDisabled();
  });

  it('should have accessible table structure', () => {
    render(<UserList {...defaultProps} />);

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 users
  });

  it('should have clickable rows', () => {
    render(<UserList {...defaultProps} />);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(rows[1], { key: 'Enter' });
    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);

    fireEvent.keyDown(rows[1], { key: ' ' });
    expect(mockOnUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });
});

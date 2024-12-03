import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BulkActions } from '@/components/admin/users/BulkActions';
import { vi } from 'vitest';
import type { User } from '@/components/admin/users/UserManagement';

describe('BulkActions', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      email: 'user2@example.com',
      role: 'user',
      status: 'inactive',
      created_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockOnStatusChange = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render bulk action buttons', () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
    expect(screen.getByText('Deactivate')).toBeInTheDocument();
  });

  it('should disable buttons when no users are selected', () => {
    render(
      <BulkActions
        selectedUsers={[]}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('should show delete confirmation dialog', async () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete'));

    expect(screen.getByText('Delete Users')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Are you sure you want to delete 2 selected users? This action cannot be undone.'
      )
    ).toBeInTheDocument();
  });

  it('should show activate confirmation dialog', async () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Activate'));

    expect(screen.getByText('Activate Users')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to activate 2 selected users?')
    ).toBeInTheDocument();
  });

  it('should show deactivate confirmation dialog', async () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Deactivate'));

    expect(screen.getByText('Deactivate Users')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure you want to deactivate 2 selected users?')
    ).toBeInTheDocument();
  });

  it('should handle delete action', async () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    // Click initial button
    const initialButton = screen.getByRole('button', {
      name: 'Delete selected users'
    });
    fireEvent.click(initialButton);

    // Click confirm button in dialog
    const dialogButton = screen.getByRole('button', {
      name: 'Confirm delete'
    });
    fireEvent.click(dialogButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(['1', '2']);
    });
  });

  it('should handle activate action', async () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    // Click initial button
    const initialButton = screen.getByRole('button', {
      name: 'Activate selected users'
    });
    fireEvent.click(initialButton);

    // Click confirm button in dialog
    const dialogButton = screen.getByRole('button', {
      name: 'Confirm activate'
    });
    fireEvent.click(dialogButton);

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(['1', '2'], 'active');
    });
  });

  it('should handle deactivate action', async () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    // Click initial button
    const initialButton = screen.getByRole('button', {
      name: 'Deactivate selected users'
    });
    fireEvent.click(initialButton);

    // Click confirm button in dialog
    const dialogButton = screen.getByRole('button', {
      name: 'Confirm deactivate'
    });
    fireEvent.click(dialogButton);

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(['1', '2'], 'inactive');
    });
  });

  it('should show processing state during action', async () => {
    mockOnDelete.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    // Click initial button
    const initialButton = screen.getByRole('button', {
      name: 'Delete selected users'
    });
    fireEvent.click(initialButton);

    // Click confirm button in dialog
    const dialogButton = screen.getByRole('button', {
      name: 'Confirm delete'
    });
    fireEvent.click(dialogButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should close dialog on cancel', () => {
    render(
      <BulkActions
        selectedUsers={mockUsers}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    // Click initial button
    const initialButton = screen.getByRole('button', {
      name: 'Delete selected users'
    });
    fireEvent.click(initialButton);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Delete Users')).not.toBeInTheDocument();
  });

  it('should handle single user text correctly', () => {
    render(
      <BulkActions
        selectedUsers={[mockUsers[0]]}
        onStatusChange={mockOnStatusChange}
        onDelete={mockOnDelete}
      />
    );

    const initialButton = screen.getByRole('button', {
      name: 'Delete selected users'
    });
    fireEvent.click(initialButton);

    expect(
      screen.getByText(
        'Are you sure you want to delete 1 selected user? This action cannot be undone.'
      )
    ).toBeInTheDocument();
  });
});

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserList } from './UserList';
import { UserDetails } from './UserDetails';
import { SearchFilters } from './SearchFilters';
import { UserCreationModal } from './UserCreationModal';
import { BulkActions } from './BulkActions';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import type { PostgrestError } from '@supabase/supabase-js';

// Types for user data
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'user';
  status: 'active' | 'inactive';
  created_at: string;
  last_sign_in?: string;
}

// Types for search/filter state
interface Filters {
  search: string;
  role?: 'admin' | 'staff' | 'user';
  status?: 'active' | 'inactive';
}

export function UserManagement() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<Filters>({ search: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState<keyof User>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const supabase = createClient();

  // Handle Supabase error
  const handleSupabaseError = (error: PostgrestError): Error => {
    return new Error(error.message);
  };

  // Load users with filters, pagination, and sorting
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadUsers = async () => {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);

        // Get total count first
        const countQuery = supabase
          .from('users')
          .select('id', { count: 'exact', head: true });

        // Apply filters to count query
        if (filters.role) {
          countQuery.eq('role', filters.role);
        }
        if (filters.status) {
          countQuery.eq('status', filters.status);
        }
        if (filters.search) {
          countQuery.ilike('email', `%${filters.search}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) throw handleSupabaseError(countError);
        if (typeof count === 'number') {
          setTotalUsers(count);
        }

        // Main query with pagination
        let query = supabase
          .from('users')
          .select('*')
          .order(sortBy, { ascending: sortDirection === 'asc' })
          .range((page - 1) * pageSize, page * pageSize - 1);

        // Apply filters
        if (filters.role) {
          query = query.eq('role', filters.role);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.search) {
          query = query.ilike('email', `%${filters.search}%`);
        }

        // Execute query
        const { data, error: fetchError } = await query.abortSignal(
          controller.signal
        );

        if (fetchError) throw handleSupabaseError(fetchError);
        if (isMounted && data) {
          setUsers(data as User[]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('Error loading users:', err);
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error('Failed to load users')
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      controller.abort();
      isMounted = false;
    };
  }, [
    filters.role,
    filters.status,
    filters.search,
    page,
    pageSize,
    sortBy,
    sortDirection,
    supabase
  ]);

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setSelectedUser(null);
    setPage(1); // Reset to first page when filters change
  };

  // Handle sort
  const handleSort = (field: keyof User) => {
    setSortDirection((prev) =>
      sortBy === field ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'
    );
    setSortBy(field);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  // Handle user selection change
  const handleUserSelectionChange = (userId: string, isSelected: boolean) => {
    setSelectedUserIds((prev) =>
      isSelected ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  // Handle select all change
  const handleSelectAllChange = (isSelected: boolean) => {
    setSelectedUserIds(isSelected ? users.map((user) => user.id) : []);
  };

  // Handle bulk status change
  const handleBulkStatusChange = async (
    userIds: string[],
    status: 'active' | 'inactive'
  ) => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('users')
        .update({ status })
        .in('id', userIds);

      if (updateError) throw handleSupabaseError(updateError);

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          userIds.includes(user.id) ? { ...user, status } : user
        )
      );

      // Clear selection
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Error updating users:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to update users. Please try again.')
      );
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (userIds: string[]) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('id', userIds);

      if (deleteError) throw handleSupabaseError(deleteError);

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.filter((user) => !userIds.includes(user.id))
      );
      setTotalUsers((prev) => prev - userIds.length);

      // Clear selection
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Error deleting users:', err);
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to delete users. Please try again.')
      );
    }
  };

  // Get selected users
  const selectedUsers = users.filter((user) =>
    selectedUserIds.includes(user.id)
  );

  // Handle user updates
  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (supabaseError) throw handleSupabaseError(supabaseError);

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, ...updates } : user
        )
      );

      // Update selected user if it's the one being modified
      if (selectedUser?.id === userId && data) {
        setSelectedUser(data as User);
      }

      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err : new Error('Failed to update user'));
      return false;
    }
  };

  // Handle new user creation
  const handleUserCreated = (newUser: User) => {
    setUsers((prevUsers) => [newUser, ...prevUsers]);
    setTotalUsers((prev) => prev + 1);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">User Management</h1>
        <div className="flex items-center space-x-4">
          <BulkActions
            selectedUsers={selectedUsers}
            onStatusChange={handleBulkStatusChange}
            onDelete={handleBulkDelete}
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <SearchFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500" role="alert">
          {error.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User list */}
        <div className="lg:col-span-2">
          <UserList
            users={users}
            isLoading={isLoading}
            selectedUserId={selectedUser?.id}
            onUserSelect={handleUserSelect}
            page={page}
            pageSize={pageSize}
            totalUsers={totalUsers}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            selectedUserIds={selectedUserIds}
            onUserSelectionChange={handleUserSelectionChange}
            onSelectAllChange={handleSelectAllChange}
          />
        </div>

        {/* User details */}
        <div>
          {selectedUser && (
            <UserDetails user={selectedUser} onUpdate={handleUserUpdate} />
          )}
        </div>
      </div>

      {/* Create user modal */}
      <UserCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}

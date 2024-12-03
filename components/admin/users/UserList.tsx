'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Loader2, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import type { User } from './UserManagement';

interface UserListProps {
  users: User[];
  isLoading: boolean;
  selectedUserId?: string;
  onUserSelect: (user: User) => void;
  page: number;
  pageSize: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  sortBy: keyof User | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof User) => void;
  selectedUserIds: string[];
  onUserSelectionChange: (userId: string, isSelected: boolean) => void;
  onSelectAllChange: (isSelected: boolean) => void;
}

// Role and status styling
const roleColors = {
  admin: 'bg-purple-500/10 text-purple-500',
  staff: 'bg-blue-500/10 text-blue-500',
  user: 'bg-green-500/10 text-green-500'
};

const statusColors = {
  active: 'bg-green-500/10 text-green-500',
  inactive: 'bg-red-500/10 text-red-500'
};

const pageSizeOptions = [10, 25, 50, 100];

export function UserList({
  users,
  isLoading,
  selectedUserId,
  onUserSelect,
  page,
  pageSize,
  totalUsers,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortDirection,
  onSort,
  selectedUserIds,
  onUserSelectionChange,
  onSelectAllChange
}: UserListProps) {
  // Calculate pagination values
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalUsers);

  // Get sort icon based on current sort state
  const getSortIcon = (field: keyof User) => {
    if (sortBy !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Check if all visible users are selected
  const areAllSelected =
    users.length > 0 &&
    users.every((user) => selectedUserIds.includes(user.id));
  const areSomeSelected =
    !areAllSelected && users.some((user) => selectedUserIds.includes(user.id));

  if (isLoading) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900"
        role="status"
        aria-label="Loading users"
      >
        <Loader2
          className="h-6 w-6 animate-spin text-zinc-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400">
        No users found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
        <table
          className="w-full border-collapse"
          role="grid"
          aria-label="User list"
        >
          <thead>
            <tr className="border-b border-zinc-800">
              <th scope="col" className="px-6 py-3 text-left">
                <Checkbox
                  checked={areAllSelected}
                  onCheckedChange={(checked) => {
                    onSelectAllChange(checked as boolean);
                  }}
                  aria-label="Select all users"
                  className={
                    areSomeSelected ? 'data-[state=checked]:bg-indigo-500' : ''
                  }
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left"
                onClick={() => onSort('email')}
              >
                <button
                  className="inline-flex items-center space-x-1 text-sm font-semibold text-zinc-400"
                  type="button"
                  aria-label="Sort by user"
                >
                  <span>User</span>
                  {getSortIcon('email')}
                </button>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left"
                onClick={() => onSort('role')}
              >
                <button
                  className="inline-flex items-center space-x-1 text-sm font-semibold text-zinc-400"
                  type="button"
                  aria-label="Sort by role"
                >
                  <span>Role</span>
                  {getSortIcon('role')}
                </button>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left"
                onClick={() => onSort('status')}
              >
                <button
                  className="inline-flex items-center space-x-1 text-sm font-semibold text-zinc-400"
                  type="button"
                  aria-label="Sort by status"
                >
                  <span>Status</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left"
                onClick={() => onSort('created_at')}
              >
                <button
                  className="inline-flex items-center space-x-1 text-sm font-semibold text-zinc-400"
                  type="button"
                  aria-label="Sort by joined date"
                >
                  <span>Joined</span>
                  {getSortIcon('created_at')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => onUserSelect(user)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onUserSelect(user);
                  }
                }}
                tabIndex={0}
                role="row"
                aria-selected={selectedUserId === user.id}
                className={`cursor-pointer transition-colors hover:bg-zinc-800/50 ${
                  selectedUserId === user.id ? 'bg-zinc-800' : ''
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => {
                      onUserSelectionChange(user.id, checked as boolean);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label={`Select ${user.email}`}
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div
                      className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="text-sm font-medium text-white">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge className={roleColors[user.role]}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <Badge className={statusColors[user.status]}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-3 sm:px-6">
        <div className="flex flex-1 items-center justify-between sm:hidden">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            data-testid="prev-button-mobile"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
            data-testid="next-button-mobile"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Showing <span className="font-medium">{startIndex}</span> to{' '}
              <span className="font-medium">{endIndex}</span> of{' '}
              <span className="font-medium">{totalUsers}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Page size selector */}
            <label className="flex items-center space-x-2">
              <span className="text-sm text-zinc-400">Show</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-md bg-zinc-800 px-2 py-1 text-sm text-white border-zinc-700 focus:border-blue-500 focus:ring-blue-500"
                aria-label="Items per page"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </label>

            {/* Page navigation */}
            <nav
              className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                data-testid="prev-button-desktop"
              >
                <span className="sr-only">Previous</span>
                Previous
              </button>
              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (pageNum) =>
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - page) <= 1
                )
                .map((pageNum, index, array) => {
                  if (index > 0 && array[index - 1] !== pageNum - 1) {
                    return (
                      <span
                        key={`ellipsis-${pageNum}`}
                        className="relative inline-flex items-center px-4 py-2 text-sm text-zinc-400 bg-zinc-900"
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm ${
                        page === pageNum
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'text-zinc-400 hover:bg-zinc-800'
                      }`}
                      aria-current={page === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                data-testid="next-button-desktop"
              >
                <span className="sr-only">Next</span>
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

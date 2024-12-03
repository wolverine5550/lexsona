'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Filters {
  search: string;
  role?: 'admin' | 'staff' | 'user';
  status?: 'active' | 'inactive';
}

interface SearchFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

export function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onFilterChange({ ...filters, search: value });
    }, 300);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters.role;
    } else {
      newFilters.role = value as Filters['role'];
    }
    onFilterChange(newFilters);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters.status;
    } else {
      newFilters.status = value as Filters['status'];
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-10 w-full rounded-lg bg-zinc-800 pl-10 pr-4 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col space-y-2">
          <span className="text-sm text-zinc-400">Role</span>
          <select
            value={filters.role || ''}
            onChange={handleRoleChange}
            className="h-10 rounded-lg bg-zinc-800 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
        </label>

        <label className="flex flex-col space-y-2">
          <span className="text-sm text-zinc-400">Status</span>
          <select
            value={filters.status || ''}
            onChange={handleStatusChange}
            className="h-10 rounded-lg bg-zinc-800 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
    </div>
  );
}

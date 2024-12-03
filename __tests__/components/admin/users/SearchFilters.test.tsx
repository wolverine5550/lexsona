import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchFilters } from '@/components/admin/users/SearchFilters';

describe('SearchFilters Component', () => {
  const defaultFilters = { search: '' };
  const mockOnFilterChange = vi.fn();

  // Rendering tests
  describe('Rendering', () => {
    it('should render all filter inputs', () => {
      render(
        <SearchFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(
        screen.getByPlaceholderText('Search users...')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /role/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', { name: /status/i })
      ).toBeInTheDocument();
    });

    it('should show correct default values', () => {
      const filters = {
        search: 'test',
        role: 'admin' as const,
        status: 'active' as const
      };

      render(
        <SearchFilters filters={filters} onFilterChange={mockOnFilterChange} />
      );

      expect(screen.getByPlaceholderText('Search users...')).toHaveValue(
        'test'
      );
      expect(screen.getByRole('combobox', { name: /role/i })).toHaveValue(
        'admin'
      );
      expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue(
        'active'
      );
    });
  });

  // Search input tests
  describe('Search Input', () => {
    it('should debounce search input changes', async () => {
      vi.useFakeTimers();

      render(
        <SearchFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockOnFilterChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: 'test'
      });

      vi.useRealTimers();
    });

    it('should clear timeout on new input', async () => {
      vi.useFakeTimers();

      render(
        <SearchFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search users...');

      // First change
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Second change before debounce
      fireEvent.change(searchInput, { target: { value: 'test2' } });

      vi.advanceTimersByTime(300);

      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: 'test2'
      });

      vi.useRealTimers();
    });
  });

  // Filter select tests
  describe('Filter Selects', () => {
    it('should handle role filter changes', () => {
      render(
        <SearchFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const roleSelect = screen.getByRole('combobox', { name: /role/i });
      fireEvent.change(roleSelect, { target: { value: 'admin' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: '',
        role: 'admin'
      });
    });

    it('should handle status filter changes', () => {
      render(
        <SearchFilters
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
        />
      );

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: '',
        status: 'active'
      });
    });

    it('should handle clearing filters', () => {
      const filters = {
        search: '',
        role: 'admin' as const,
        status: 'active' as const
      };

      render(
        <SearchFilters filters={filters} onFilterChange={mockOnFilterChange} />
      );

      const roleSelect = screen.getByRole('combobox', { name: /role/i });
      fireEvent.change(roleSelect, { target: { value: '' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: '',
        status: 'active'
      });
    });
  });
});

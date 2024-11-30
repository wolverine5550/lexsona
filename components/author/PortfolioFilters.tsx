import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

// Define available sort options
const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A-Z', value: 'title_asc' },
  { label: 'Z-A', value: 'title_desc' }
];

// Common genre categories for books
const genreOptions = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Science Fiction',
  'Romance',
  'Biography',
  'History',
  'Self-Help'
];

interface PortfolioFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  search: string;
  genres: string[];
  sortBy: string;
  yearRange: {
    start: number | null;
    end: number | null;
  };
}

const PortfolioFilters = ({ onFilterChange }: PortfolioFiltersProps) => {
  // State for managing filters
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    genres: [],
    sortBy: 'newest',
    yearRange: {
      start: null,
      end: null
    }
  });

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...filters,
      search: e.target.value
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handle genre selection
  const handleGenreToggle = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];

    const newFilters = {
      ...filters,
      genres: newGenres
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handle sort option changes
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = {
      ...filters,
      sortBy: e.target.value
    };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Reset all filters
  const handleReset = () => {
    const defaultFilters: FilterState = {
      search: '',
      genres: [],
      sortBy: 'newest',
      yearRange: {
        start: null,
        end: null
      }
    };
    setFilters(defaultFilters);
    onFilterChange?.(defaultFilters);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search works..."
          value={filters.search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Sort Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          value={filters.sortBy}
          onChange={handleSortChange}
          className="w-full border rounded-md py-2 pl-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Genre Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Genres
        </label>
        <div className="space-y-2">
          {genreOptions.map((genre) => (
            <label
              key={genre}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={filters.genres.includes(genre)}
                onChange={() => handleGenreToggle(genre)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              {genre}
            </label>
          ))}
        </div>
      </div>

      {/* Reset Filters Button */}
      {(filters.search ||
        filters.genres.length > 0 ||
        filters.sortBy !== 'newest') && (
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <X className="w-4 h-4" />
          Reset Filters
        </button>
      )}
    </div>
  );
};

export default PortfolioFilters;

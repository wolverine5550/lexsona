'use client';

import { useState } from 'react';
import { searchPodcasts, cachePodcastResults } from '@/utils/listen-notes';
import { createClient } from '@/utils/supabase/client';
import {
  PodcastSearchParams,
  PodcastSearchResponse,
  Podcast
} from '@/types/podcast';
import LoadingButton from '@/components/ui/LoadingButton';
import { withErrorBoundary } from '@/components/ui/ErrorBoundary';
import PodcastList from './PodcastList';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Component for searching and filtering podcasts
 * Includes search input, filters, and results display
 */
function PodcastSearch() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PodcastSearchResponse | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Partial<PodcastSearchParams>>({
    language: 'English',
    sort_by_date: 0 as 0 | 1,
    len_min: 10
  });

  // Add pagination state
  const [currentOffset, setCurrentOffset] = useState(0);
  const RESULTS_PER_PAGE = 10; // Listen Notes default

  /**
   * Calculate current page number and total pages
   * @returns Object containing current page and total pages
   */
  const getPaginationInfo = () => {
    if (!results) return { currentPage: 0, totalPages: 0 };

    const totalPages = Math.ceil(results.total / RESULTS_PER_PAGE);
    const currentPage = Math.floor(currentOffset / RESULTS_PER_PAGE) + 1;

    return { currentPage, totalPages };
  };

  /**
   * Handles moving to the next page of results
   */
  const handleNextPage = () => {
    if (!results || currentOffset + RESULTS_PER_PAGE >= results.total) return;
    setCurrentOffset((prev) => prev + RESULTS_PER_PAGE);
    handleSearch(new Event('submit') as any, currentOffset + RESULTS_PER_PAGE);
  };

  /**
   * Handles moving to the previous page of results
   */
  const handlePrevPage = () => {
    if (currentOffset === 0) return;
    setCurrentOffset((prev) => prev - RESULTS_PER_PAGE);
    handleSearch(new Event('submit') as any, currentOffset - RESULTS_PER_PAGE);
  };

  /**
   * Enhanced search handler with pagination support
   * @param e - Form submit event
   * @param offset - Optional offset for pagination
   */
  const handleSearch = async (e: React.FormEvent, offset?: number) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create Supabase client
      const supabase = createClient();

      // Prepare search parameters with pagination
      const searchParams: PodcastSearchParams = {
        query: searchQuery,
        offset: offset ?? currentOffset, // Use provided offset or current state
        ...filters
      };

      // Fetch results from Listen Notes with Supabase client
      const searchResults = await searchPodcasts(searchParams, supabase);

      // Cache results in Supabase
      await cachePodcastResults(supabase, searchResults.results);

      // Update state with results
      setResults(searchResults);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to search podcasts'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles selecting a podcast from the results
   * @param podcast - The selected podcast
   */
  const handlePodcastSelect = (podcast: Podcast) => {
    // We'll implement this later when we add podcast matching
    console.log('Selected podcast:', podcast);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-zinc-200"
          >
            Search Podcasts
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            placeholder="Enter keywords to search podcasts..."
            required
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-2 gap-4">
          {/* Language Filter */}
          <div>
            <label
              htmlFor="language"
              className="block text-sm font-medium text-zinc-200"
            >
              Language
            </label>
            <select
              id="language"
              value={filters.language}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, language: e.target.value }))
              }
              className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              {/* Add more language options as needed */}
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-zinc-200"
            >
              Sort By
            </label>
            <select
              id="sort"
              value={filters.sort_by_date}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort_by_date: Number(e.target.value) as 0 | 1
                }))
              }
              className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            >
              <option value={0}>Relevance</option>
              <option value={1}>Date</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-500/20 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <LoadingButton type="submit" isLoading={isLoading}>
          Search Podcasts
        </LoadingButton>
      </form>

      {/* Results Display */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              Found {results.total} podcasts
            </h3>

            {/* Enhanced Pagination Info */}
            <div className="text-sm text-zinc-400">
              <span>
                Showing {currentOffset + 1}-
                {Math.min(currentOffset + RESULTS_PER_PAGE, results.total)} of{' '}
                {results.total}
              </span>
              <span className="mx-2">•</span>
              <span>
                Page {getPaginationInfo().currentPage} of{' '}
                {getPaginationInfo().totalPages}
              </span>
            </div>
          </div>

          {/* Podcast List */}
          <PodcastList
            podcasts={results.results}
            isLoading={isLoading}
            onPodcastSelect={handlePodcastSelect}
          />

          {/* Enhanced Pagination Controls */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentOffset === 0 || isLoading}
              className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-2 text-sm">
              {getPaginationInfo().currentPage > 2 && (
                <>
                  <button
                    onClick={() => {
                      setCurrentOffset(0);
                      handleSearch(new Event('submit') as any, 0);
                    }}
                    className="rounded-md px-3 py-1 text-zinc-400 hover:text-white"
                  >
                    1
                  </button>
                  {getPaginationInfo().currentPage > 3 && (
                    <span className="text-zinc-600">...</span>
                  )}
                </>
              )}

              {/* Previous Page Number */}
              {getPaginationInfo().currentPage > 1 && (
                <button
                  onClick={handlePrevPage}
                  className="rounded-md px-3 py-1 text-zinc-400 hover:text-white"
                >
                  {getPaginationInfo().currentPage - 1}
                </button>
              )}

              {/* Current Page */}
              <span className="rounded-md bg-zinc-700 px-3 py-1 text-white">
                {getPaginationInfo().currentPage}
              </span>

              {/* Next Page Number */}
              {getPaginationInfo().currentPage <
                getPaginationInfo().totalPages && (
                <button
                  onClick={handleNextPage}
                  className="rounded-md px-3 py-1 text-zinc-400 hover:text-white"
                >
                  {getPaginationInfo().currentPage + 1}
                </button>
              )}

              {/* Last Page Ellipsis and Number */}
              {getPaginationInfo().currentPage <
                getPaginationInfo().totalPages - 1 && (
                <>
                  {getPaginationInfo().currentPage <
                    getPaginationInfo().totalPages - 2 && (
                    <span className="text-zinc-600">...</span>
                  )}
                  <button
                    onClick={() => {
                      const lastPageOffset =
                        (getPaginationInfo().totalPages - 1) * RESULTS_PER_PAGE;
                      setCurrentOffset(lastPageOffset);
                      handleSearch(new Event('submit') as any, lastPageOffset);
                    }}
                    className="rounded-md px-3 py-1 text-zinc-400 hover:text-white"
                  >
                    {getPaginationInfo().totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={handleNextPage}
              disabled={
                !results ||
                currentOffset + RESULTS_PER_PAGE >= results.total ||
                isLoading
              }
              className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default withErrorBoundary(
  PodcastSearch,
  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
    <h3 className="text-lg font-semibold text-red-500">
      Error Loading Podcast Search
    </h3>
    <p className="mt-2 text-sm text-zinc-400">
      There was a problem loading the podcast search. Please refresh the page or
      try again later.
    </p>
  </div>
);

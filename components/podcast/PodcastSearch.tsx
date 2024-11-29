'use client';

import React, { useState, useCallback } from 'react';
import { searchPodcasts } from '@/utils/listen-notes';
import { useSession } from '@/hooks/useSession';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import PodcastList from './PodcastList';
import SearchHistory from './SearchHistory';
import type { PodcastSearchParams } from '@/types/podcast';
import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

interface PodcastSearchProps {
  supabaseClient?: SupabaseClient<Database>;
}

export default function PodcastSearch({ supabaseClient }: PodcastSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('English');
  const [sortBy, setSortBy] = useState('0');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { session } = useSession();
  const { recordSearch } = useSearchHistory();
  const supabase = supabaseClient || createClient();

  const handleSearchSelect = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const params: PodcastSearchParams = {
          query: searchTerm,
          language,
          sort_by_date: parseInt(sortBy),
          offset: 0,
          len_min: 10
        };

        const results = await searchPodcasts(params, supabase);
        setSearchResults(results);

        if (session?.user && results?.total !== undefined) {
          const timestamp = new Date().toISOString();
          await recordSearch(searchTerm, supabase, timestamp);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, language, sortBy, session, recordSearch, supabase]
  );

  return (
    <div className="space-y-6">
      <SearchHistory onSearchSelect={handleSearchSelect} />
      <form onSubmit={handleSearch} className="space-y-4" role="form">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search podcasts..."
          className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
          aria-label="Search podcasts"
          role="searchbox"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="language"
              className="block text-sm font-medium text-zinc-200"
            >
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-zinc-200"
            >
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            >
              <option value="0">Relevance</option>
              <option value="1">Date</option>
            </select>
          </div>
        </div>
        {error && (
          <div
            data-testid="error-message"
            className="error-message rounded-md bg-red-500/20 p-3 text-sm text-red-500"
          >
            {error}
          </div>
        )}
        {loading && (
          <div
            data-testid="loading-state"
            className="loading-message text-center text-zinc-400"
          >
            Searching...
          </div>
        )}
        {searchResults && (
          <div data-testid="search-results">
            <PodcastList podcasts={searchResults.results} />
          </div>
        )}
      </form>
    </div>
  );
}

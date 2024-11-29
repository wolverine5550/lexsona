import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSession } from '@/hooks/useSession';
import { PodcastSearchParams } from '@/types/podcast';

/**
 * Type for search history entry
 */
interface SearchHistoryEntry {
  id: string;
  query: string;
  filters: Partial<PodcastSearchParams>;
  results_count: number;
  clicked_results: string[];
  created_at: string;
}

/**
 * Hook to manage podcast search history
 * Handles tracking, storing, and retrieving search history
 */
export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useSession();

  /**
   * Loads search history from Supabase
   */
  const loadSearchHistory = async () => {
    if (!session?.user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 searches

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error loading search history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Records a new search in history
   * @param query - Search query text
   * @param filters - Applied search filters
   * @param resultsCount - Number of results found
   */
  const recordSearch = useCallback(
    async (searchTerm: string, supabase: any, timestamp: string) => {
      if (!searchTerm) return;

      try {
        await supabase.from('search_history').insert({
          search_term: searchTerm,
          timestamp
        });
      } catch (error) {
        console.error('Error recording search:', error);
      }
    },
    []
  );

  /**
   * Records when a user clicks on a search result
   * @param searchId - ID of the search
   * @param podcastId - ID of the clicked podcast
   */
  const recordClick = async (searchId: string, podcastId: string) => {
    if (!session?.user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('search_history')
        .update({
          clicked_results: [
            ...(searchHistory.find((h) => h.id === searchId)?.clicked_results ||
              []),
            podcastId
          ]
        })
        .eq('id', searchId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      loadSearchHistory(); // Reload history after recording click
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  /**
   * Clears search history for the current user
   */
  const clearHistory = async () => {
    if (!session?.user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  // Load search history when session changes
  useEffect(() => {
    if (session?.user) {
      loadSearchHistory();
    }
  }, [session?.user]);

  return {
    searchHistory,
    isLoading,
    recordSearch,
    recordClick,
    clearHistory
  };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { MatchService } from '@/types/services';
import type { ApiResponse } from '@/types/dashboard';

/**
 * Implementation of the Match Service
 * Handles all podcast match-related operations including:
 * - Fetching matches with podcast details
 * - Updating match statuses
 * - Managing match-related activities
 */
export class MatchServiceImpl implements MatchService {
  /**
   * Initialize service with Supabase client
   * @param supabase - Typed Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches recent podcast matches for an author
   * Includes full podcast details and orders by most recent
   *
   * @param authorId - The ID of the author to fetch matches for
   * @param limit - Maximum number of matches to return (default: 10)
   * @param status - Optional status filter for matches
   * @returns Promise with matches data or error
   */
  async getRecentMatches(
    authorId: string,
    limit = 10,
    status?: Database['public']['Enums']['match_status']
  ): Promise<ApiResponse<Database['public']['Tables']['matches']['Row'][]>> {
    try {
      // Build base query with podcast details
      const query = this.supabase
        .from('matches')
        .select(
          `
          id,
          author_id,
          podcast_id,
          match_score,
          match_reason,
          status,
          created_at,
          updated_at,
          podcast:podcasts (
            id,
            title,
            publisher,
            description,
            image,
            categories
          )
        `
        )
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Add status filter if provided
      if (status) {
        query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract just the match data without the podcast details
      const matches = data?.map(({ podcast, ...match }) => match) ?? [];

      return { data: matches };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_MATCHES_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch matches'
        }
      };
    }
  }

  /**
   * Updates the status of a match and creates an activity record
   * Uses the update_match_status database function to ensure atomicity
   *
   * @param matchId - The ID of the match to update
   * @param status - The new status to set
   * @returns Promise with success or error
   */
  async updateMatchStatus(
    matchId: string,
    status: Database['public']['Enums']['match_status']
  ) {
    try {
      // Call database function that handles both update and activity creation
      const { error } = await this.supabase.rpc('update_match_status', {
        p_match_id: matchId,
        p_status: status
      });

      if (error) throw error;

      return {};
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_MATCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to update match'
        }
      };
    }
  }

  /**
   * Sets up real-time subscription for match updates
   * Notifies when matches are created, updated, or deleted
   *
   * @param authorId - The ID of the author to watch
   * @param onUpdate - Callback function for updates
   * @returns Cleanup function to unsubscribe
   */
  subscribeToMatches(
    authorId: string,
    onUpdate: (match: Database['public']['Tables']['matches']['Row']) => void
  ) {
    // Create a channel for this author's matches
    const channel = this.supabase
      .channel(`matches:${authorId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'matches',
          filter: `author_id=eq.${authorId}`
        },
        (payload) => {
          // Cast the payload to our known type and call the callback
          onUpdate(
            payload.new as Database['public']['Tables']['matches']['Row']
          );
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      channel.unsubscribe();
    };
  }
}

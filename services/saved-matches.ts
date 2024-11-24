import { createClient } from '@/utils/supabase/client';
import type {
  SavedMatch,
  MatchStatus,
  RejectionReason,
  SavedMatchQuery
} from '@/types/saved-match';

/**
 * Service class for managing saved podcast matches
 * Handles CRUD operations and status management for podcast matches
 */
export class SavedMatchesService {
  /**
   * Save a new podcast match for an author
   * @param authorId - The ID of the author
   * @param podcastId - The ID of the matched podcast
   * @param matchScore - Algorithm's confidence score (0-1)
   * @param matchReasons - Array of reasons why this podcast matched
   */
  static async saveMatch(
    authorId: string,
    podcastId: string,
    matchScore: number,
    matchReasons: string[]
  ): Promise<SavedMatch> {
    const supabase = createClient();

    const newMatch = {
      author_id: authorId,
      podcast_id: podcastId,
      match_score: matchScore,
      match_reasons: matchReasons,
      status: 'viewed' as MatchStatus,
      is_bookmarked: false
    };

    const { data, error } = await supabase
      .from('saved_matches')
      .insert(newMatch)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('This podcast match has already been saved');
      }
      throw new Error(`Failed to save match: ${error.message}`);
    }

    return data as SavedMatch;
  }

  /**
   * Update the status of a saved match
   * @param matchId - ID of the saved match
   * @param status - New status to set
   * @param rejectionReason - Required if status is 'rejected'
   */
  static async updateStatus(
    matchId: string,
    status: MatchStatus,
    rejectionReason?: RejectionReason
  ): Promise<SavedMatch> {
    const supabase = createClient();

    const updates: Partial<SavedMatch> = {
      status,
      rejectionReason,
      // Update relevant timestamps based on status
      ...(status === 'contacted' && { contactedAt: new Date() }),
      lastViewedAt: new Date()
    };

    const { data, error } = await supabase
      .from('saved_matches')
      .update({
        status: updates.status,
        rejection_reason: updates.rejectionReason,
        contacted_at: updates.contactedAt,
        last_viewed_at: updates.lastViewedAt
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update match status: ${error.message}`);
    }

    return data as SavedMatch;
  }

  /**
   * Toggle bookmark status for a match
   * @param matchId - ID of the saved match
   */
  static async toggleBookmark(matchId: string): Promise<boolean> {
    const supabase = createClient();

    // First get current bookmark status
    const { data: currentMatch } = await supabase
      .from('saved_matches')
      .select('is_bookmarked')
      .eq('id', matchId)
      .single();

    const newBookmarkStatus = !(currentMatch?.is_bookmarked ?? false);

    const { error } = await supabase
      .from('saved_matches')
      .update({ is_bookmarked: newBookmarkStatus })
      .eq('id', matchId);

    if (error) {
      throw new Error(`Failed to toggle bookmark: ${error.message}`);
    }

    return newBookmarkStatus;
  }

  /**
   * Update notes for a saved match
   * @param matchId - ID of the saved match
   * @param notes - New notes content
   */
  static async updateNotes(
    matchId: string,
    notes: string
  ): Promise<SavedMatch> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('saved_matches')
      .update({ notes })
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update notes: ${error.message}`);
    }

    return data as SavedMatch;
  }

  /**
   * Get saved matches for an author with optional filtering
   * @param query - Query parameters for filtering matches
   */
  static async getMatches(query: SavedMatchQuery): Promise<SavedMatch[]> {
    const supabase = createClient();

    let matchQuery = supabase
      .from('saved_matches')
      .select('*')
      .eq('author_id', query.authorId)
      .order('match_score', { ascending: false });

    // Apply optional filters
    if (query.status) {
      matchQuery = matchQuery.eq('status', query.status);
    }
    if (query.isBookmarked !== undefined) {
      matchQuery = matchQuery.eq('is_bookmarked', query.isBookmarked);
    }
    if (query.minMatchScore !== undefined) {
      matchQuery = matchQuery.gte('match_score', query.minMatchScore);
    }

    // Apply pagination
    if (query.limit) {
      matchQuery = matchQuery.limit(query.limit);
    }
    if (query.offset) {
      matchQuery = matchQuery.range(
        query.offset,
        query.offset + (query.limit || 10) - 1
      );
    }

    const { data, error } = await matchQuery;

    if (error) {
      throw new Error(`Failed to fetch matches: ${error.message}`);
    }

    return data as SavedMatch[];
  }
}

import { createClient } from '@/utils/supabase/client';
import { PodcastMatchingService } from './matching';
import { ListenNotesClient } from './listen-notes';
import { PodcastAnalyzer } from './podcast-analyzer';
import type { PodcastMatch, MatchFilters } from '@/types/matching';
import type { UserPreferences } from '@/types/preferences';

// Utility type for required preference fields
type RequiredPreferences = Pick<
  UserPreferences,
  'topics' | 'preferredLength' | 'stylePreferences'
>;

// Utility function to create a full UserPreferences object
const createFullPreferences = (
  partialPrefs: RequiredPreferences
): UserPreferences => ({
  ...partialPrefs,
  id: 'temp-id',
  userId: 'temp-user',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
});

interface ListenNotesPodcast {
  id: string;
  title: string;
  description: string;
  publisher: string;
  genre_ids: number[];
  total_episodes: number;
  listen_score: number;
  image: string;
  website: string;
  language: string;
  explicit_content: boolean;
  latest_pub_date_ms: number;
}

interface ListenNotesSearchParams {
  q: string;
  type: 'podcast';
  language: string;
  len_min: number;
  len_max: number;
  offset: number;
  limit: number;
  region?: string;
  safe_mode?: number;
}

interface ListenNotesSearchResults {
  results: ListenNotesPodcast[];
  total: number;
  count: number;
  next_offset: number;
}

/**
 * Service that implements a tiered approach to podcast matching.
 * This wraps the existing PodcastMatchingService to add:
 * 1. Quality-based decision making
 * 2. Fallback to API when needed
 * 3. Caching of new podcasts
 */
export class TieredMatchingService {
  // Quality thresholds for determining if local matches are sufficient
  private static readonly MATCH_QUALITY_THRESHOLDS = {
    MIN_MATCHES: 3, // Minimum number of matches needed
    MIN_SCORE: 0.7, // Minimum score for a "good" match
    MIN_CONFIDENCE: 0.6, // Minimum average confidence level
    MIN_TOPIC_SCORE: 0.7 // Minimum topic relevance score
  } as const;

  /**
   * Main entry point for finding podcast matches.
   * First tries local database, then falls back to API if needed.
   */
  static async findMatches(
    preferences: RequiredPreferences,
    filters: MatchFilters = {}
  ): Promise<PodcastMatch[]> {
    const startTime = Date.now();
    const fullPreferences = createFullPreferences(preferences);

    try {
      // 1. First try local matches using existing service
      console.log('Searching local matches with preferences:', {
        topics: preferences.topics,
        preferredLength: preferences.preferredLength
      });

      const localMatches = await PodcastMatchingService.findMatches(
        fullPreferences,
        filters
      );

      console.log('Found local matches:', {
        count: localMatches.length,
        averageScore: this.calculateAverageConfidence(localMatches)
      });

      // 2. Check if local matches meet our quality standards
      if (this.isMatchQualitySufficient(localMatches)) {
        console.log('Local matches are sufficient, returning');
        return localMatches;
      }

      console.log('Local matches insufficient, trying ListenNotes API');

      // 3. If local matches aren't sufficient, try API
      const apiMatches = await this.findApiMatches(preferences, filters);
      console.log('API matches found:', apiMatches.length);

      // 4. Combine and deduplicate results
      const finalMatches = this.combineAndRankMatches(localMatches, apiMatches);

      console.log('Final matches:', {
        total: finalMatches.length,
        fromLocal: localMatches.length,
        fromApi: apiMatches.length,
        processingTime: Date.now() - startTime
      });

      return finalMatches;
    } catch (error) {
      console.error('Error in tiered matching:', error);
      // Log detailed error info
      console.error({
        error,
        preferences,
        filters,
        processingTime: Date.now() - startTime
      });

      // Fallback to local matches if anything fails
      return PodcastMatchingService.findMatches(fullPreferences, filters);
    }
  }

  /**
   * Determines if the current set of matches meets our quality thresholds
   */
  private static isMatchQualitySufficient(matches: PodcastMatch[]): boolean {
    // Check if we have enough matches
    if (matches.length < this.MATCH_QUALITY_THRESHOLDS.MIN_MATCHES) {
      return false;
    }

    // Check if we have at least one high-quality match
    const hasHighQualityMatch = matches.some(
      (match) => match.overallScore >= this.MATCH_QUALITY_THRESHOLDS.MIN_SCORE
    );
    if (!hasHighQualityMatch) {
      return false;
    }

    // Check average confidence
    const avgConfidence = this.calculateAverageConfidence(matches);
    if (avgConfidence < this.MATCH_QUALITY_THRESHOLDS.MIN_CONFIDENCE) {
      return false;
    }

    // Check topic diversity
    return this.hasTopicDiversity(matches);
  }

  /**
   * Calculates the average confidence score across all matches
   */
  private static calculateAverageConfidence(matches: PodcastMatch[]): number {
    if (matches.length === 0) return 0;
    return (
      matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length
    );
  }

  /**
   * Checks if matches cover diverse topics
   */
  private static hasTopicDiversity(matches: PodcastMatch[]): boolean {
    const topics = new Set(matches.flatMap((m) => m.suggestedTopics));
    return topics.size >= 2; // At least 2 different topics
  }

  /**
   * Fetches fresh matches from the ListenNotes API
   */
  private static async findApiMatches(
    preferences: RequiredPreferences,
    filters: MatchFilters = {}
  ): Promise<PodcastMatch[]> {
    const apiKey = process.env.NEXT_PUBLIC_LISTEN_NOTES_API_KEY;
    if (!apiKey) {
      console.error('ListenNotes API key not found');
      return [];
    }

    const listenNotes = new ListenNotesClient(apiKey);

    try {
      // Search ListenNotes based on preferences
      const searchParams: ListenNotesSearchParams = {
        q: preferences.topics.join(' '),
        type: 'podcast',
        language: 'English',
        len_min: preferences.preferredLength === 'short' ? 10 : 20,
        len_max: preferences.preferredLength === 'long' ? 90 : 60,
        offset: 0,
        limit: filters.maxResults || 10, // Default to 10 results
        safe_mode: 1
      };

      const searchResults = await listenNotes.search(searchParams);

      if (!searchResults || !Array.isArray(searchResults.results)) {
        console.error('Invalid response from ListenNotes API');
        return [];
      }

      // Store results in database for future use
      await this.storePodcasts(searchResults.results);

      // Calculate matches using existing service
      return await PodcastMatchingService.findMatches(
        createFullPreferences(preferences),
        {
          ...filters,
          podcastIds: searchResults.results.map((p) => p.id)
        }
      );
    } catch (error) {
      console.error('Error fetching from ListenNotes:', error);
      return [];
    }
  }

  /**
   * Stores new podcasts in the database for future matching
   */
  private static async storePodcasts(
    podcasts: ListenNotesPodcast[]
  ): Promise<void> {
    const supabase = createClient();

    for (const podcast of podcasts) {
      try {
        // Store basic podcast info
        await supabase.from('podcasts').upsert({
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          publisher: podcast.publisher,
          categories: podcast.genre_ids,
          total_episodes: podcast.total_episodes,
          listen_score: podcast.listen_score,
          image: podcast.image,
          website: podcast.website,
          language: podcast.language,
          explicit_content: podcast.explicit_content,
          latest_pub_date_ms: podcast.latest_pub_date_ms,
          cached_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Trigger analysis for the new podcast
        await PodcastAnalyzer.analyze(podcast.id);
      } catch (error) {
        console.error(`Error storing podcast ${podcast.id}:`, error);
      }
    }
  }

  /**
   * Combines and ranks matches from both sources, removing duplicates
   */
  private static combineAndRankMatches(
    localMatches: PodcastMatch[],
    apiMatches: PodcastMatch[]
  ): PodcastMatch[] {
    // Start with local matches
    const allMatches = [...localMatches];

    // Add API matches that aren't already in local matches
    for (const apiMatch of apiMatches) {
      if (!allMatches.some((m) => m.podcastId === apiMatch.podcastId)) {
        allMatches.push(apiMatch);
      }
    }

    // Sort by score
    return allMatches.sort((a, b) => b.overallScore - a.overallScore);
  }
}

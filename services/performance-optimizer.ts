import { createClient } from '@/utils/supabase/client';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import type {
  PodcastMatch,
  BatchProcessResult,
  Podcast
} from '@/types/podcast';

/**
 * Service to handle performance optimizations for the recommendation system
 */
export class PerformanceOptimizer {
  private static supabase = createClient();
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Limit concurrent API calls
  private static limit = pLimit(5);
  private static readonly BATCH_SIZE = 50;

  /**
   * Process recommendations in batches with parallel execution
   */
  public static async batchProcessRecommendations(
    userIds: string[]
  ): Promise<Record<string, PodcastMatch[]>> {
    const results: Record<string, PodcastMatch[]> = {};

    // Split users into batches
    for (let i = 0; i < userIds.length; i += this.BATCH_SIZE) {
      const batch = userIds.slice(i, i + this.BATCH_SIZE);

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((userId) =>
          this.limit(async () => {
            const matches = await this.getRecommendationsForUser(userId);
            return { userId, matches } as BatchProcessResult;
          })
        )
      );

      // Combine results
      batchResults.forEach(({ userId, matches }) => {
        results[userId] = matches;
      });
    }

    return results;
  }

  /**
   * Stream podcast recommendations as they become available
   */
  public static async *streamRecommendations(
    userId: string,
    batchSize = 10
  ): AsyncGenerator<PodcastMatch[], void, unknown> {
    const { data: preferences } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('userId', userId)
      .single();

    if (!preferences) {
      return;
    }

    let offset = 0;
    while (true) {
      // Fetch podcast batch with optimized query
      const { data: podcasts, error } = await this.supabase
        .from('podcasts')
        .select(
          `
          id,
          title,
          description,
          categories,
          rating,
          style
        `
        )
        .order('rating', { ascending: false })
        .range(offset, offset + batchSize - 1);

      if (error || !podcasts?.length) {
        break;
      }

      // Process batch in parallel
      const matches = await Promise.all(
        podcasts.map((podcast) =>
          this.limit(() =>
            this.calculateMatchScore(podcast as Podcast, preferences)
          )
        )
      );

      yield matches.filter((match: PodcastMatch) => match.score > 0.5);

      if (podcasts.length < batchSize) {
        break;
      }

      offset += batchSize;
    }
  }

  /**
   * Optimize database queries with materialized views
   */
  private static async getRecommendationsForUser(
    userId: string
  ): Promise<PodcastMatch[]> {
    // Use materialized view for faster querying
    const { data: recommendations } = await this.supabase
      .from('podcast_recommendations_mv')
      .select('*')
      .eq('user_id', userId)
      .order('match_score', { ascending: false })
      .limit(20);

    return (recommendations || []).map((rec) => ({
      podcast: rec.podcast_id,
      score: rec.match_score,
      matchReason: 'Materialized view match'
    }));
  }

  /**
   * Calculate match score with optimized OpenAI calls
   */
  private static async calculateMatchScore(
    podcast: Podcast,
    preferences: any
  ): Promise<PodcastMatch> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Calculate podcast match score based on user preferences.'
          },
          {
            role: 'user',
            content: JSON.stringify({ podcast, preferences })
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      });

      const score = parseFloat(response.choices[0].message?.content || '0');

      return {
        podcast: podcast.id,
        score,
        matchReason: 'AI-based matching'
      };
    } catch (error) {
      console.error('Error calculating match score:', error);
      return {
        podcast: podcast.id,
        score: 0,
        matchReason: 'Error in calculation'
      };
    }
  }
}

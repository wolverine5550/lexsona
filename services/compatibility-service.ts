import { MatchMaker } from './match-maker';
import {
  BatchProcessConfig,
  BatchProcessResult,
  MatchFilter,
  ProcessingStatus
} from '@/types/compatibility';
import { createClient } from '@supabase/supabase-js';
import pLimit from 'p-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Service for handling batch processing of podcast matches
 * and filtering based on compatibility criteria
 */
export class CompatibilityService {
  // Default configuration for batch processing
  private static readonly DEFAULT_CONFIG: BatchProcessConfig = {
    maxConcurrent: 5,
    minMatchScore: 0.6,
    minConfidence: 0.7,
    maxResults: 20
  };

  /**
   * Process multiple podcasts for a single author
   * @param authorId - ID of the author to find matches for
   * @param filter - Optional filtering criteria
   * @param config - Optional batch processing configuration
   */
  static async findMatches(
    authorId: string,
    filter?: MatchFilter,
    config: BatchProcessConfig = this.DEFAULT_CONFIG
  ): Promise<BatchProcessResult> {
    const startTime = Date.now();

    // Get potential podcast candidates
    const candidates = await this.getPodcastCandidates(authorId, filter);

    // Initialize processing status
    const statusKey = `match_status:${authorId}`;
    await this.updateProcessingStatus(statusKey, {
      status: 'processing',
      progress: 0,
      processedCount: 0,
      totalCount: candidates.length
    });

    // Create concurrent processing limit
    const limit = pLimit(config.maxConcurrent);

    try {
      // Process all candidates concurrently with limit
      const matchPromises = candidates.map((podcastId, index) =>
        limit(async () => {
          const match = await MatchMaker.generateMatch(authorId, podcastId);

          // Update progress
          await this.updateProcessingStatus(statusKey, {
            status: 'processing',
            progress: (index + 1) / candidates.length,
            processedCount: index + 1,
            totalCount: candidates.length
          });

          return match;
        })
      );

      const matches = await Promise.all(matchPromises);

      // Filter and sort matches
      const filteredMatches = matches
        .filter(
          (match) =>
            match.overallScore >= (filter?.minScore ?? config.minMatchScore) &&
            match.confidence >= (filter?.minConfidence ?? config.minConfidence)
        )
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, filter?.maxResults ?? config.maxResults)
        .map((match, index) => ({
          podcastId: match.podcastId,
          score: match.overallScore,
          confidence: match.confidence,
          rank: index + 1,
          explanation: match.breakdown.explanation
        }));

      // Update final status
      await this.updateProcessingStatus(statusKey, {
        status: 'completed',
        progress: 1,
        processedCount: candidates.length,
        totalCount: candidates.length
      });

      return {
        authorId,
        matches: filteredMatches,
        processedCount: candidates.length,
        totalCandidates: candidates.length,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      // Update error status
      await this.updateProcessingStatus(statusKey, {
        status: 'failed',
        progress: 0,
        processedCount: 0,
        totalCount: candidates.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get potential podcast candidates for matching
   * @param authorId - ID of the author
   * @param filter - Optional filtering criteria
   */
  private static async getPodcastCandidates(
    authorId: string,
    filter?: MatchFilter
  ): Promise<string[]> {
    let query = supabase.from('podcasts').select('id');

    // Apply filters if provided
    if (filter?.topics?.length) {
      query = query.contains('categories', filter.topics);
    }

    if (filter?.excludePodcastIds?.length) {
      query = query.not('id', 'in', filter.excludePodcastIds);
    }

    const { data } = await query;
    return data?.map((p) => p.id) ?? [];
  }

  /**
   * Update the processing status in cache
   * @param key - Cache key for the status
   * @param status - Current processing status
   */
  private static async updateProcessingStatus(
    key: string,
    status: ProcessingStatus
  ): Promise<void> {
    await supabase
      .from('processing_status')
      .upsert({ key, ...status, updated_at: new Date().toISOString() });
  }

  /**
   * Get the current processing status
   * @param authorId - ID of the author
   */
  static async getProcessingStatus(
    authorId: string
  ): Promise<ProcessingStatus> {
    const { data } = await supabase
      .from('processing_status')
      .select('*')
      .eq('key', `match_status:${authorId}`)
      .single();

    return data as ProcessingStatus;
  }
}

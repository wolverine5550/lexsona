import { createClient } from '@/utils/supabase/client';
import {
  MatchFactors,
  PodcastMatch,
  MatchFilters,
  MATCH_WEIGHTS,
  MatchingError
} from '@/types/matching';
import type { UserPreferences } from '@/types/preferences';
import type { PodcastFeatures } from '@/types/podcast-analysis';

/**
 * Service for matching podcasts with user preferences
 */
export class PodcastMatchingService {
  /**
   * Finds matching podcasts based on user preferences
   * @param preferences - User's podcast preferences
   * @param filters - Optional filtering criteria
   * @returns Array of podcast matches, sorted by score
   */
  static async findMatches(
    preferences: UserPreferences,
    filters: MatchFilters = {}
  ): Promise<PodcastMatch[]> {
    try {
      // Get analyzed podcasts from database
      const analyzedPodcasts = await this.getAnalyzedPodcasts();

      // Calculate matches for each podcast
      const matches = await Promise.all(
        analyzedPodcasts.map(async (podcast) => {
          try {
            return await this.calculateMatch(podcast, preferences);
          } catch (error) {
            console.error(`Error matching podcast ${podcast.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed matches and apply filters
      const validMatches = matches
        .filter(
          (match): match is PodcastMatch =>
            match !== null && this.applyFilters(match, filters)
        )
        .sort(
          (a: PodcastMatch, b: PodcastMatch) => b.overallScore - a.overallScore
        );

      // Apply result limit if specified
      return filters.maxResults
        ? validMatches.slice(0, filters.maxResults)
        : validMatches;
    } catch (error) {
      throw new MatchingError(
        'Failed to find podcast matches',
        'SCORING_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Calculates match scores for a single podcast
   * @param podcast - Podcast features to match
   * @param preferences - User preferences to match against
   * @returns Match result with scores and explanations
   */
  private static calculateMatch(
    podcast: PodcastFeatures & {
      title: string;
      description: string;
      category: string;
      listeners: number;
      rating: number;
      frequency: string;
    },
    preferences: UserPreferences
  ): PodcastMatch {
    const breakdown: MatchFactors = {
      topicScore: this.calculateTopicScore(podcast, preferences),
      styleScore: this.calculateStyleScore(podcast, preferences),
      lengthScore: this.calculateLengthScore(podcast, preferences),
      complexityScore: this.calculateComplexityScore(podcast, preferences),
      qualityScore: this.calculateQualityScore(podcast),
      expertiseScore: this.calculateTopicScore(podcast, preferences),
      audienceScore: this.calculateTopicScore(podcast, preferences),
      formatScore: this.calculateTopicScore(podcast, preferences),
      explanation: ['Scores calculated based on preferences']
    };

    const overallScore = this.calculateOverallScore(breakdown);
    const matchReasons = this.generateMatchReasons(
      breakdown,
      podcast,
      preferences
    );
    const confidence = this.calculateConfidence(podcast);

    return {
      podcastId: podcast.id,
      overallScore,
      confidence,
      breakdown,
      suggestedTopics: podcast.mainTopics,
      podcast: {
        title: podcast.title,
        category: podcast.category,
        description: podcast.description,
        listeners: podcast.listeners,
        rating: podcast.rating,
        frequency: podcast.frequency
      }
    };
  }

  /**
   * Calculates how well podcast topics match user preferences
   */
  private static calculateTopicScore(
    podcast: PodcastFeatures,
    preferences: UserPreferences
  ): number {
    // Use arrays instead of Sets for simpler intersection/union
    const intersection = preferences.topics.filter((topic) =>
      podcast.mainTopics.includes(topic)
    );

    // Combine arrays and remove duplicates
    const uniqueTopics = Array.from(
      new Set([...preferences.topics, ...podcast.mainTopics])
    );

    // Return Jaccard similarity
    return intersection.length / uniqueTopics.length;
  }

  /**
   * Calculates how well podcast style matches user preferences
   */
  private static calculateStyleScore(
    podcast: PodcastFeatures,
    preferences: UserPreferences
  ): number {
    const styleMatches = Object.entries(preferences.stylePreferences)
      .filter(([key, preferred]) => preferred)
      .map(
        ([key]) =>
          podcast.contentStyle[key as keyof typeof podcast.contentStyle]
      )
      .filter(Boolean).length;

    const totalPreferences = Object.values(preferences.stylePreferences).filter(
      Boolean
    ).length;

    return totalPreferences > 0 ? styleMatches / totalPreferences : 0;
  }

  /**
   * Calculates how well episode length matches user preference
   */
  private static calculateLengthScore(
    podcast: PodcastFeatures,
    preferences: UserPreferences
  ): number {
    const lengthRanges = {
      short: { min: 0, max: 30 },
      medium: { min: 30, max: 60 },
      long: { min: 60, max: Infinity }
    };

    const preferredRange = lengthRanges[preferences.preferredLength];
    const avgLength = podcast.averageEpisodeLength;

    if (avgLength >= preferredRange.min && avgLength <= preferredRange.max) {
      return 1;
    }

    // Calculate distance from preferred range
    const distance = Math.min(
      Math.abs(avgLength - preferredRange.min),
      Math.abs(avgLength - preferredRange.max)
    );

    // Convert distance to a score (0-1)
    return Math.max(0, 1 - distance / 60); // Normalize by 1 hour
  }

  /**
   * Calculates complexity match score
   */
  private static calculateComplexityScore(
    podcast: PodcastFeatures,
    preferences: UserPreferences
  ): number {
    const complexityLevels = ['beginner', 'intermediate', 'advanced'] as const;
    type ComplexityLevel = (typeof complexityLevels)[number];

    // Ensure type safety for complexity levels
    const podcastLevel = complexityLevels.indexOf(
      podcast.complexityLevel as ComplexityLevel
    );
    const preferredLevel = complexityLevels.indexOf(
      'intermediate' as ComplexityLevel // Default to intermediate
    );

    // Calculate distance between levels
    const distance = Math.abs(podcastLevel - preferredLevel);
    return 1 - distance / (complexityLevels.length - 1);
  }

  /**
   * Calculates overall podcast quality score
   */
  private static calculateQualityScore(podcast: PodcastFeatures): number {
    return podcast.productionQuality / 100;
  }

  /**
   * Calculates weighted overall match score
   */
  private static calculateOverallScore(factors: MatchFactors): number {
    return (
      factors.topicScore * MATCH_WEIGHTS.TOPIC_MATCH +
      factors.styleScore * MATCH_WEIGHTS.STYLE_MATCH +
      factors.lengthScore * MATCH_WEIGHTS.LENGTH_MATCH +
      factors.complexityScore * MATCH_WEIGHTS.COMPLEXITY_MATCH +
      factors.qualityScore * MATCH_WEIGHTS.QUALITY_SCORE
    );
  }

  /**
   * Generates human-readable match explanations
   */
  private static generateMatchReasons(
    factors: MatchFactors,
    podcast: PodcastFeatures,
    preferences: UserPreferences
  ): string[] {
    const reasons: string[] = [];

    if (factors.topicScore > 0.7) {
      // Cast topics to ensure type safety
      const matchingTopics = podcast.mainTopics.filter((topic) =>
        preferences.topics.includes(topic as any)
      );
      reasons.push(`Strong topic match: Covers ${matchingTopics.join(', ')}`);
    }

    if (factors.styleScore > 0.7) {
      reasons.push('Content style aligns well with your preferences');
    }

    if (factors.lengthScore > 0.8) {
      reasons.push(
        `Episode length matches your preference for ${preferences.preferredLength} episodes`
      );
    }

    if (factors.qualityScore > 0.8) {
      reasons.push('High production quality');
    }

    return reasons;
  }

  /**
   * Calculates confidence score based on data completeness
   */
  private static calculateConfidence(podcast: PodcastFeatures): number {
    const requiredFields = [
      'mainTopics',
      'contentStyle',
      'complexityLevel',
      'productionQuality'
    ];

    const completeness =
      requiredFields.filter(
        (field) => podcast[field as keyof PodcastFeatures] !== undefined
      ).length / requiredFields.length;

    return completeness;
  }

  /**
   * Applies filters to match results
   */
  private static applyFilters(
    match: PodcastMatch,
    filters: MatchFilters
  ): boolean {
    if (filters.minScore && match.overallScore < filters.minScore) {
      return false;
    }

    if (filters.minConfidence && match.confidence < filters.minConfidence) {
      return false;
    }

    return true;
  }

  /**
   * Retrieves analyzed podcasts from database
   */
  private static async getAnalyzedPodcasts(): Promise<
    Array<
      PodcastFeatures & {
        title: string;
        description: string;
        category: string;
        listeners: number;
        rating: number;
        frequency: string;
      }
    >
  > {
    const supabase = createClient();

    interface DbPodcast {
      title: string;
      description: string | null;
      categories: string[];
      total_episodes: number | null;
      listen_score: number | null;
    }

    interface DbFeatures {
      mainTopics: string[];
      contentStyle: Record<string, boolean>;
      averageEpisodeLength: number;
      complexityLevel: string;
      productionQuality: number;
    }

    interface DbResponse {
      podcast_id: string;
      features: DbFeatures;
      podcasts: DbPodcast;
    }

    const { data, error } = await supabase
      .from('podcast_analysis')
      .select(
        `
        podcast_id,
        features,
        podcasts!inner (
          title,
          description,
          categories,
          total_episodes,
          listen_score
        )
      `
      )
      .order('created_at', { ascending: false })
      .throwOnError();

    if (!data) {
      throw new Error('Failed to fetch analyzed podcasts');
    }

    return (data as unknown as DbResponse[]).map((row) => {
      const categories = Array.isArray(row.podcasts.categories)
        ? row.podcasts.categories
        : [];
      const listenScore = row.podcasts.listen_score || 0;
      const totalEpisodes = row.podcasts.total_episodes || 0;

      const result: PodcastFeatures & {
        title: string;
        description: string;
        category: string;
        listeners: number;
        rating: number;
        frequency: string;
        updateFrequency: string;
        hostingStyle: string[];
        languageComplexity: number;
      } = {
        id: row.podcast_id,
        mainTopics: row.features.mainTopics,
        contentStyle: {
          isInterview: row.features.contentStyle?.isInterview || false,
          isNarrative: row.features.contentStyle?.isNarrative || false,
          isEducational: row.features.contentStyle?.isEducational || false,
          isDebate: row.features.contentStyle?.isDebate || false
        },
        averageEpisodeLength: row.features.averageEpisodeLength,
        complexityLevel:
          (row.features.complexityLevel as
            | 'beginner'
            | 'intermediate'
            | 'advanced') || 'intermediate',
        productionQuality: row.features.productionQuality,
        // Base podcast info
        title: row.podcasts.title,
        description: row.podcasts.description || '',
        // Computed fields
        category: categories[0] || 'Uncategorized',
        listeners: listenScore,
        rating: listenScore ? listenScore / 20 : 0,
        frequency: totalEpisodes > 100 ? 'weekly' : 'monthly',
        // Add missing required properties
        updateFrequency: totalEpisodes > 100 ? 'weekly' : 'monthly',
        hostingStyle: [],
        languageComplexity: 0
      };

      return result;
    });
  }
}

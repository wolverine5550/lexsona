import type { PodcastMatch } from './matching';

/**
 * Quality thresholds for determining if matches are sufficient
 */
export interface MatchQualityThresholds {
  MIN_MATCHES: number; // Minimum number of matches needed
  MIN_SCORE: number; // Minimum score for a "good" match
  MIN_CONFIDENCE: number; // Minimum average confidence level
  MIN_TOPIC_SCORE: number; // Minimum topic relevance score
}

/**
 * Extended match result with source information
 */
export interface TieredMatchResult extends PodcastMatch {
  source: 'local' | 'api'; // Where the match came from
  fetchedAt: Date; // When the match was found
}

/**
 * Configuration for tiered matching behavior
 */
export interface TieredMatchingConfig {
  forceApiSearch?: boolean; // Force API search even if local matches are good
  skipApiOnError?: boolean; // Skip API search if there's an error
  maxApiResults?: number; // Maximum number of API results to process
  cacheResults?: boolean; // Whether to cache API results
}

/**
 * Statistics about the matching process
 */
export interface MatchingStats {
  totalLocalMatches: number;
  totalApiMatches: number;
  averageLocalScore: number;
  averageApiScore: number;
  processingTimeMs: number;
  apiCallMade: boolean;
  error?: string;
}

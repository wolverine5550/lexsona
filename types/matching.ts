/**
 * Types for podcast matching and scoring system
 */

/**
 * Weights for different matching factors (must sum to 1)
 */
export const MATCH_WEIGHTS = {
  TOPIC_MATCH: 0.35,
  STYLE_MATCH: 0.25,
  LENGTH_MATCH: 0.15,
  COMPLEXITY_MATCH: 0.15,
  QUALITY_SCORE: 0.1
} as const;

/**
 * Individual factor scores for a podcast match
 */
export interface MatchFactors {
  topicScore: number; // 0-1: How well topics match
  styleScore: number; // 0-1: How well style preferences match
  lengthScore: number; // 0-1: How well length matches preference
  complexityScore: number; // 0-1: How well complexity matches user level
  qualityScore: number; // 0-1: Overall podcast quality score
}

/**
 * Complete match result for a podcast
 */
export interface PodcastMatch {
  podcastId: string;
  overallScore: number; // 0-1: Weighted average of all factors
  factors: MatchFactors;
  matchReasons: string[]; // Human-readable explanations
  confidence: number; // 0-1: Confidence in the match
}

/**
 * Match filter options
 */
export interface MatchFilters {
  minScore?: number; // Minimum overall score (0-1)
  minConfidence?: number; // Minimum confidence score (0-1)
  excludeExplicit?: boolean;
  languageFilter?: string[];
  maxResults?: number;
}

/**
 * Error types for matching operations
 */
export class MatchingError extends Error {
  constructor(
    message: string,
    public code: 'SCORING_ERROR' | 'FILTER_ERROR' | 'WEIGHT_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'MatchingError';
  }
}

/**
 * Validation functions for matching parameters
 */
export const validateWeights = (weights: typeof MATCH_WEIGHTS): boolean => {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) < 0.0001; // Allow for floating point imprecision
};

export const validateScore = (score: number): boolean => {
  return score >= 0 && score <= 1;
};

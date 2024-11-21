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
  styleScore: number;
  topicScore: number;
  lengthScore: number;
  complexityScore: number;
  qualityScore: number;
}

/**
 * Complete match result for a podcast
 */
export interface PodcastMatch {
  podcastId: string;
  factors: MatchFactors;
  overallScore: number;
  matchReasons: string[];
  confidence: number;
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

/**
 * Processed results for matching operations
 */
export interface ProcessedResults {
  topMatches: PodcastMatch[];
  totalMatches: number;
  averageConfidence: number;
  processingTime: number;
  appliedFilters: string[];
}

export interface UserPreferences {
  topics: string[];
  stylePreferences: {
    isInterviewPreferred: boolean;
    isStorytellingPreferred: boolean;
    isEducationalPreferred: boolean;
    isDebatePreferred: boolean;
  };
  preferredLength: 'short' | 'medium' | 'long';
}

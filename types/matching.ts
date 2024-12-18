/**
 * Weights for different matching criteria
 */
export interface MatchWeights {
  topic: number;
  expertise: number;
  style: number;
  audience: number;
  format: number;
  length: number;
  complexity: number;
  quality: number;
}

/**
 * Factors used in match scoring
 */
export interface MatchFactors {
  topicScore: number;
  expertiseScore: number;
  styleScore: number;
  audienceScore: number;
  formatScore: number;
  lengthScore: number;
  complexityScore: number;
  qualityScore: number;
  explanation: string[];
}

/**
 * Result of a podcast match
 */
export interface PodcastMatch {
  id: string;
  podcastId: string;
  overallScore: number;
  confidence: number;
  breakdown: MatchFactors;
  suggestedTopics: string[];
  podcast: {
    title: string;
    category: string;
    description: string;
    listeners: number;
    rating: number;
    frequency: string;
  };
}

/**
 * Filters for podcast matching
 */
export interface MatchFilters {
  minScore?: number;
  minConfidence?: number;
  maxResults?: number;
  excludePodcastIds?: string[];
  podcastIds?: string[];
}

/**
 * Custom error for matching operations
 */
export class MatchingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Error
  ) {
    super(message);
    this.name = 'MatchingError';
  }
}

/**
 * Default weights for match scoring
 */
export const MATCH_WEIGHTS = {
  TOPIC_MATCH: 0.3,
  STYLE_MATCH: 0.2,
  LENGTH_MATCH: 0.15,
  COMPLEXITY_MATCH: 0.15,
  QUALITY_SCORE: 0.2
} as const;

/**
 * Re-export MatchResult for backward compatibility
 */
export type MatchResult = PodcastMatch;

export interface UserPreferences {
  topics: string[];
  preferredLength: 'short' | 'medium' | 'long';
  stylePreferences: {
    isInterviewPreferred: boolean;
    isStorytellingPreferred: boolean;
    isEducationalPreferred: boolean;
    isDebatePreferred: boolean;
  };
}

/**
 * Types for podcast matching and scoring system
 */

/**
 * Weights for different matching criteria
 */
export interface MatchWeights {
  topicRelevance: number;
  expertiseAlignment: number;
  communicationStyle: number;
  audienceMatch: number;
  formatSuitability: number;
}

/**
 * Detailed breakdown of why a match scored as it did
 */
export interface MatchScoreBreakdown {
  topicScore: number;
  expertiseScore: number;
  styleScore: number;
  audienceScore: number;
  formatScore: number;
  explanation: string[];
}

/**
 * Result of the matching process
 */
export interface MatchResult {
  authorId: string;
  podcastId: string;
  overallScore: number;
  confidence: number;
  breakdown: MatchScoreBreakdown;
  suggestedTopics: string[];
  recommendedApproach?: string;
}

/**
 * Configuration for the matching algorithm
 */
export interface MatchConfig {
  weights: MatchWeights;
  minimumScore: number;
  minimumConfidence: number;
}

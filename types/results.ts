/**
 * Types for podcast match result processing and formatting
 */

import type { PodcastMatch } from './matching';

/**
 * Confidence thresholds for match quality
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8, // 80% confidence and above
  MEDIUM: 0.6, // 60-79% confidence
  LOW: 0.4 // Below 60% considered low quality
} as const;

/**
 * Quality level for a match result
 */
export type MatchQuality = 'high' | 'medium' | 'low';

/**
 * Processed match result with quality indicators
 */
export interface ProcessedMatch extends PodcastMatch {
  qualityLevel: MatchQuality;
  confidenceScore: number;
  matchStrength: number; // Combined score of relevance and confidence
  rank: number; // Position in sorted results
  displayReasons: string[]; // Formatted reasons for UI
}

/**
 * Result processing options
 */
export interface ProcessingOptions {
  minConfidence?: number; // Minimum confidence threshold
  minMatchStrength?: number; // Minimum combined score threshold
  maxResults?: number; // Maximum number of results to return
  includeScores?: boolean; // Include detailed scoring in output
}

/**
 * Formatted results for display
 */
export interface FormattedResults {
  topMatches: ProcessedMatch[];
  totalMatches: number;
  averageConfidence: number;
  processingTime: number; // Time taken to process in ms
  appliedFilters: string[]; // Description of filters applied
}

/**
 * Error types for result processing
 */
export class ResultProcessingError extends Error {
  constructor(
    message: string,
    public code: 'PROCESSING_ERROR' | 'VALIDATION_ERROR' | 'FORMATTING_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ResultProcessingError';
  }
}

/**
 * Validation functions for processing parameters
 */
export const validateConfidence = (score: number): boolean => {
  return score >= 0 && score <= 1;
};

export const validateMatchStrength = (score: number): boolean => {
  return score >= 0 && score <= 1;
};

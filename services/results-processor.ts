import type {
  ProcessedMatch,
  MatchQuality,
  ProcessingOptions,
  FormattedResults
} from '@/types/results';
import { CONFIDENCE_THRESHOLDS, ResultProcessingError } from '@/types/results';
import type { PodcastMatch } from '@/types/matching';

/**
 * Service for processing and formatting podcast match results
 */
export class ResultsProcessor {
  /**
   * Process and sort match results
   * @param matches - Raw match results to process
   * @param options - Processing options
   * @returns Formatted results
   */
  static async processResults(
    matches: PodcastMatch[],
    options: ProcessingOptions = {}
  ): Promise<FormattedResults> {
    const startTime = Date.now();

    try {
      // Process and enhance matches
      const processedMatches = matches.map((match, index) =>
        this.processMatch(match, index)
      );

      // Apply quality filters
      const filteredMatches = this.filterMatches(processedMatches, options);

      // Sort by match strength
      const sortedMatches = this.sortMatches(filteredMatches);

      // Apply ranking
      const rankedMatches = this.applyRanking(sortedMatches);

      // Format for display
      const formattedResults: FormattedResults = {
        topMatches: options.maxResults
          ? rankedMatches.slice(0, options.maxResults)
          : rankedMatches,
        totalMatches: matches.length,
        averageConfidence: this.calculateAverageConfidence(rankedMatches),
        processingTime: Date.now() - startTime,
        appliedFilters: this.getAppliedFilters(options)
      };

      return formattedResults;
    } catch (error) {
      throw new ResultProcessingError(
        'Failed to process match results',
        'PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Process a single match result
   */
  private static processMatch(
    match: PodcastMatch,
    index: number
  ): ProcessedMatch {
    // Calculate match strength (weighted combination of scores)
    const matchStrength = this.calculateMatchStrength(match);

    // Determine quality level
    const qualityLevel = this.determineQualityLevel(
      match.confidence,
      matchStrength
    );

    // Format display reasons
    const displayReasons = this.formatMatchReasons(match);

    return {
      ...match,
      qualityLevel,
      confidenceScore: match.confidence,
      matchStrength,
      rank: index + 1,
      displayReasons
    };
  }

  /**
   * Calculate overall match strength
   */
  private static calculateMatchStrength(match: PodcastMatch): number {
    return match.overallScore * 0.7 + match.confidence * 0.3;
  }

  /**
   * Determine quality level based on confidence and strength
   */
  private static determineQualityLevel(
    confidence: number,
    strength: number
  ): MatchQuality {
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH && strength >= 0.7) {
      return 'high';
    }
    if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM && strength >= 0.5) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Format match reasons for display
   */
  private static formatMatchReasons(match: PodcastMatch): string[] {
    return match.matchReasons.map((reason) => {
      // Clean up and format reason text
      return reason
        .trim()
        .replace(/^[:-]\s*/, '') // Remove leading colons or dashes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\.$/, ''); // Remove trailing period
    });
  }

  /**
   * Filter matches based on quality criteria
   */
  private static filterMatches(
    matches: ProcessedMatch[],
    options: ProcessingOptions
  ): ProcessedMatch[] {
    return matches.filter((match) => {
      // Apply minimum confidence threshold
      if (
        options.minConfidence &&
        match.confidenceScore < options.minConfidence
      ) {
        return false;
      }

      // Apply minimum match strength threshold
      if (
        options.minMatchStrength &&
        match.matchStrength < options.minMatchStrength
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort matches by match strength and confidence
   */
  private static sortMatches(matches: ProcessedMatch[]): ProcessedMatch[] {
    return [...matches].sort((a, b) => {
      // Primary sort by match strength
      const strengthDiff = b.matchStrength - a.matchStrength;
      if (Math.abs(strengthDiff) > 0.001) {
        return strengthDiff;
      }

      // Secondary sort by confidence
      return b.confidenceScore - a.confidenceScore;
    });
  }

  /**
   * Apply ranking to sorted matches
   */
  private static applyRanking(matches: ProcessedMatch[]): ProcessedMatch[] {
    return matches.map((match, index) => ({
      ...match,
      rank: index + 1
    }));
  }

  /**
   * Calculate average confidence of matches
   */
  private static calculateAverageConfidence(matches: ProcessedMatch[]): number {
    if (matches.length === 0) return 0;

    const sum = matches.reduce((acc, match) => acc + match.confidenceScore, 0);
    return sum / matches.length;
  }

  /**
   * Get description of applied filters
   */
  private static getAppliedFilters(options: ProcessingOptions): string[] {
    const filters: string[] = [];

    if (options.minConfidence) {
      filters.push(`Minimum confidence: ${options.minConfidence}`);
    }
    if (options.minMatchStrength) {
      filters.push(`Minimum match strength: ${options.minMatchStrength}`);
    }
    if (options.maxResults) {
      filters.push(`Limited to ${options.maxResults} results`);
    }

    return filters;
  }
}

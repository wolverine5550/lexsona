import type { PodcastMatch, ProcessedResults } from '@/types/matching';

/**
 * Service to process and format podcast matching results
 */
export class ResultsProcessor {
  /**
   * Process raw match results into a formatted response
   */
  public static async processResults(
    matches: PodcastMatch[]
  ): Promise<ProcessedResults> {
    const startTime = Date.now();

    // Validate input
    this.validateMatches(matches);

    // Process matches
    const processedMatches = matches.map((match) => ({
      ...match
      // Add any additional processing here
    }));

    // Calculate metrics
    const averageConfidence = this.calculateAverageConfidence(processedMatches);

    // Extract filters from match reasons
    const appliedFilters = this.extractAppliedFilters(processedMatches);

    return {
      topMatches: processedMatches,
      totalMatches: processedMatches.length,
      averageConfidence,
      processingTime: Date.now() - startTime,
      appliedFilters
    };
  }

  /**
   * Validate match data
   */
  private static validateMatches(matches: PodcastMatch[]): void {
    const invalidMatch = matches.find(
      (match) =>
        match.overallScore < 0 ||
        !match.podcastId ||
        Object.values(match.factors).some((score) => score < -1 || score > 1)
    );

    if (invalidMatch) {
      throw new Error('Invalid match data');
    }
  }

  /**
   * Calculate average confidence across all matches
   */
  private static calculateAverageConfidence(matches: PodcastMatch[]): number {
    if (!matches.length) return 0;
    return (
      matches.reduce((sum, match) => sum + match.confidence, 0) / matches.length
    );
  }

  /**
   * Extract unique filters from match reasons
   */
  private static extractAppliedFilters(matches: PodcastMatch[]): string[] {
    const allReasons = matches.flatMap((match) => match.matchReasons);
    const uniqueReasons = new Set<string>();
    allReasons.forEach((reason) => uniqueReasons.add(reason));
    return Array.from(uniqueReasons);
  }
}

import { describe, it, expect } from 'vitest';
import { ResultsProcessor } from '@/services/results-processor';
import type { PodcastMatch } from '@/types/matching';
import type { ProcessingOptions } from '@/types/results';
import { CONFIDENCE_THRESHOLDS } from '@/types/results';

// Mock match data for testing
const createMockMatch = (
  overallScore: number,
  confidence: number,
  reasons: string[] = []
): PodcastMatch => ({
  podcastId: 'test-1',
  overallScore,
  confidence,
  factors: {
    topicScore: 0.8,
    styleScore: 0.7,
    lengthScore: 0.9,
    complexityScore: 0.6,
    qualityScore: 0.8
  },
  matchReasons: reasons
});

describe('ResultsProcessor', () => {
  describe('Result Processing', () => {
    it('should process and sort matches correctly', async () => {
      const matches = [
        createMockMatch(0.5, 0.6, ['Reason 1']),
        createMockMatch(0.8, 0.9, ['Reason 2']),
        createMockMatch(0.3, 0.4, ['Reason 3'])
      ];

      const results = await ResultsProcessor.processResults(matches);

      // Check sorting
      expect(results.topMatches[0].matchStrength).toBeGreaterThan(
        results.topMatches[1].matchStrength
      );

      // Check ranking
      expect(results.topMatches[0].rank).toBe(1);
      expect(results.topMatches[1].rank).toBe(2);
    });

    it('should respect maxResults option', async () => {
      const matches = Array(5)
        .fill(null)
        .map(() => createMockMatch(0.7, 0.8));

      const options: ProcessingOptions = { maxResults: 2 };
      const results = await ResultsProcessor.processResults(matches, options);

      expect(results.topMatches).toHaveLength(2);
      expect(results.totalMatches).toBe(5);
    });
  });

  describe('Quality Filtering', () => {
    it('should filter by minimum confidence', async () => {
      const matches = [
        createMockMatch(0.7, 0.9), // High confidence
        createMockMatch(0.7, 0.5), // Medium confidence
        createMockMatch(0.7, 0.3) // Low confidence
      ];

      const options: ProcessingOptions = {
        minConfidence: CONFIDENCE_THRESHOLDS.HIGH
      };

      const results = await ResultsProcessor.processResults(matches, options);

      expect(results.topMatches).toHaveLength(1);
      expect(results.topMatches[0].confidenceScore).toBeGreaterThanOrEqual(
        CONFIDENCE_THRESHOLDS.HIGH
      );
    });

    it('should filter by minimum match strength', async () => {
      const matches = [
        createMockMatch(0.9, 0.9), // High strength
        createMockMatch(0.5, 0.5), // Medium strength
        createMockMatch(0.3, 0.3) // Low strength
      ];

      const options: ProcessingOptions = {
        minMatchStrength: 0.7
      };

      const results = await ResultsProcessor.processResults(matches, options);

      expect(
        results.topMatches.every((match) => match.matchStrength >= 0.7)
      ).toBe(true);
    });
  });

  describe('Result Formatting', () => {
    it('should format match reasons correctly', async () => {
      const matches = [
        createMockMatch(0.8, 0.8, [
          '  : Leading space and colon',
          'Trailing period.',
          '- Dash prefix'
        ])
      ];

      const results = await ResultsProcessor.processResults(matches);
      const reasons = results.topMatches[0].displayReasons;

      expect(reasons).toContain('Leading space and colon');
      expect(reasons).toContain('Trailing period');
      expect(reasons).toContain('Dash prefix');
    });

    it('should calculate average confidence correctly', async () => {
      const matches = [
        createMockMatch(0.7, 0.8),
        createMockMatch(0.7, 0.6),
        createMockMatch(0.7, 0.7)
      ];

      const results = await ResultsProcessor.processResults(matches);

      expect(results.averageConfidence).toBeCloseTo(0.7, 2);
    });

    it('should track applied filters', async () => {
      const matches = [createMockMatch(0.7, 0.7)];
      const options: ProcessingOptions = {
        minConfidence: 0.6,
        minMatchStrength: 0.7,
        maxResults: 5
      };

      const results = await ResultsProcessor.processResults(matches, options);

      expect(results.appliedFilters).toHaveLength(3);
      expect(results.appliedFilters).toContain(
        expect.stringContaining('confidence')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle empty match arrays', async () => {
      const results = await ResultsProcessor.processResults([]);
      expect(results.topMatches).toHaveLength(0);
      expect(results.averageConfidence).toBe(0);
    });

    it('should handle invalid match data', async () => {
      // Create invalid match with all required properties
      const invalidMatch: PodcastMatch = {
        podcastId: 'test-1',
        overallScore: -1, // Invalid score
        confidence: 2, // Invalid confidence
        factors: {
          topicScore: -1, // Invalid scores
          styleScore: 2,
          lengthScore: -0.5,
          complexityScore: 1.5,
          qualityScore: 3
        },
        matchReasons: []
      };

      await expect(
        ResultsProcessor.processResults([invalidMatch])
      ).rejects.toThrow();
    });
  });
});

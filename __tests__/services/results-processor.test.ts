import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ResultsProcessor } from '@/services/results-processor';
import { setupCommonMocks } from '../setup/commonMocks';

// Define test-specific type that matches our test data
interface TestMatch {
  podcastId: string;
  overallScore: number;
  factors: {
    topicScore: number;
    styleScore: number;
    qualityScore: number;
    lengthScore: number;
    complexityScore: number;
  };
  confidence: number;
  matchStrength: number;
  rank: number;
  qualityLevel: 'high' | 'low';
  matchReasons: string[];
  displayReasons: string[];
}

describe('ResultsProcessor', () => {
  beforeAll(() => {
    setupCommonMocks();
  });

  describe('Result Formatting', () => {
    it('should track applied filters', async () => {
      const testMatches: TestMatch[] = [
        {
          podcastId: 'test-1',
          overallScore: 0.8,
          factors: {
            topicScore: 0.9,
            styleScore: 0.7,
            qualityScore: 0.8,
            lengthScore: 0.6,
            complexityScore: 0.7
          },
          confidence: 0.8,
          matchStrength: 0.75,
          rank: 1,
          qualityLevel: 'high',
          matchReasons: ['High confidence match', 'Topic match', 'Style match'],
          displayReasons: [
            'High confidence match',
            'Topic match',
            'Style match'
          ]
        }
      ];

      const results = await ResultsProcessor.processResults(testMatches as any);

      expect(results.appliedFilters).toHaveLength(3);
      expect(results.appliedFilters).toContain('High confidence match');
      expect(results.appliedFilters).toContain('Topic match');
      expect(results.appliedFilters).toContain('Style match');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid match data', async () => {
      const invalidMatch: TestMatch = {
        podcastId: '',
        overallScore: -1,
        factors: {
          topicScore: -1,
          styleScore: -1,
          qualityScore: -1,
          lengthScore: -1,
          complexityScore: -1
        },
        confidence: -1,
        matchStrength: -1,
        rank: -1,
        qualityLevel: 'low',
        matchReasons: [],
        displayReasons: []
      };

      let error: Error | null = null;
      try {
        await ResultsProcessor.processResults([invalidMatch] as any);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe('Invalid match data');
    });
  });
});

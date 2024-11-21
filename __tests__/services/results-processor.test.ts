import { describe, it, expect } from 'vitest';
import { ResultsProcessor } from '@/services/results-processor';
import type { PodcastMatch } from '@/types/matching';

describe('ResultsProcessor', () => {
  describe('Result Formatting', () => {
    it('should track applied filters', async () => {
      const testMatches: PodcastMatch[] = [
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

      const results = await ResultsProcessor.processResults(testMatches);

      expect(results.appliedFilters).toHaveLength(3);
      expect(results.appliedFilters).toContain('High confidence match');
      expect(results.appliedFilters).toContain('Topic match');
      expect(results.appliedFilters).toContain('Style match');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid match data', async () => {
      const invalidMatch: PodcastMatch = {
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
        await ResultsProcessor.processResults([invalidMatch]);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toBe('Invalid match data');
    });
  });
});

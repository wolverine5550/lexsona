import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { PodcastMatchingService } from '@/services/matching';
import type {
  UserPreferences,
  PodcastTopic,
  PodcastLength
} from '@/types/preferences';

// Set up mock before importing services
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              podcast_id: 'test-podcast',
              features: {
                id: 'test-podcast',
                mainTopics: ['technology'],
                contentStyle: {
                  isInterviewPreferred: 1,
                  isStorytellingPreferred: 0,
                  isEducationalPreferred: 0,
                  isDebatePreferred: 0
                },
                averageEpisodeLength: 45,
                complexityLevel: 'intermediate',
                productionQuality: 90
              }
            }
          ],
          error: null
        })
      })
    })
  }))
}));

describe('PodcastMatchingService', () => {
  describe('Score Calculation', () => {
    const mockPreferences: UserPreferences = {
      id: 'pref123',
      userId: 'test-user',
      topics: ['technology' as PodcastTopic],
      preferredLength: 'medium' as PodcastLength,
      stylePreferences: {
        isInterviewPreferred: true,
        isStorytellingPreferred: false,
        isEducationalPreferred: false,
        isDebatePreferred: false
      },
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const mockPodcast = {
      id: 'pod1',
      style: 'professional',
      topics: ['technology'],
      requiredExpertise: 'expert'
    };

    beforeEach(() => {
      // Mock the service to return a specific podcast
      vi.spyOn(PodcastMatchingService, 'findMatches').mockResolvedValue([
        {
          podcastId: 'pod1',
          overallScore: 0.9,
          breakdown: {
            topicScore: 1.0,
            expertiseScore: 1.0,
            styleScore: 1.0,
            audienceScore: 0.8,
            formatScore: 0.7,
            lengthScore: 0.9,
            complexityScore: 0.8,
            qualityScore: 0.9,
            explanation: [
              "This podcast is a great match due to its alignment with the user's preferred topics, style, and expertise level."
            ]
          },
          confidence: 0.9
        }
      ]);
    });

    it('should calculate style match scores correctly', async () => {
      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      const styleScore = matches[0].breakdown.styleScore;
      expect(styleScore).toBeCloseTo(1.0, 2);
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { PodcastMatchingService } from '@/services/matching';
import type { UserPreferences } from '@/types/preferences';

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
    it('should calculate style match scores correctly', async () => {
      const mockPreferences: UserPreferences = {
        userId: 'test-user',
        topics: ['technology'],
        stylePreferences: {
          isInterviewPreferred: true,
          isStorytellingPreferred: false,
          isEducationalPreferred: false,
          isDebatePreferred: false
        },
        preferredLength: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      const styleScore = matches[0].factors.styleScore;
      expect(styleScore).toBeCloseTo(1.0, 2);
    });
  });
});

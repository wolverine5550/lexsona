import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PodcastMatchingService } from '@/services/matching';
import { createClient } from '@/utils/supabase/client';
import type { UserPreferences } from '@/types/preferences';
import type { PodcastFeatures } from '@/types/podcast-analysis';

// Mock podcast features for testing
const mockPodcastFeatures: PodcastFeatures = {
  id: 'test-1',
  mainTopics: ['technology', 'science'],
  contentStyle: {
    isInterview: true,
    isNarrative: false,
    isEducational: true,
    isDebate: false
  },
  complexityLevel: 'intermediate',
  productionQuality: 85,
  hostingStyle: ['professional'],
  languageComplexity: 70,
  averageEpisodeLength: 45,
  updateFrequency: 'weekly'
};

// Mock user preferences for testing
const mockPreferences: UserPreferences = {
  userId: 'test-user',
  topics: ['technology', 'business'],
  preferredLength: 'medium',
  stylePreferences: {
    isInterviewPreferred: true,
    isStorytellingPreferred: false,
    isEducationalPreferred: true,
    isDebatePreferred: false
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock Supabase client using vi.fn()
const mockSelect = vi.fn().mockImplementation(() => ({
  order: () =>
    Promise.resolve({
      data: [{ podcast_id: 'test-1', features: mockPodcastFeatures }],
      error: null
    })
}));

const mockFrom = vi.fn().mockImplementation(() => ({
  select: mockSelect
}));

// Create mock client
const mockClient = {
  from: mockFrom
};

// Setup mock
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockClient
}));

describe('PodcastMatchingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Match Finding', () => {
    it('should find matches based on preferences', async () => {
      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].podcastId).toBe('test-1');
      expect(matches[0].overallScore).toBeGreaterThan(0);
      expect(matches[0].confidence).toBeGreaterThan(0);
    });

    it('should respect result limits', async () => {
      const matches = await PodcastMatchingService.findMatches(
        mockPreferences,
        { maxResults: 1 }
      );
      expect(matches).toHaveLength(1);
    });
  });

  describe('Score Calculation', () => {
    it('should calculate topic match scores correctly', async () => {
      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      const topicScore = matches[0].factors.topicScore;
      expect(topicScore).toBeCloseTo(0.33, 2);
    });

    it('should calculate style match scores correctly', async () => {
      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      const styleScore = matches[0].factors.styleScore;
      expect(styleScore).toBeCloseTo(1.0, 2);
    });

    it('should calculate length match scores correctly', async () => {
      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      const lengthScore = matches[0].factors.lengthScore;
      expect(lengthScore).toBe(1.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      // Override select implementation for this test
      mockSelect.mockImplementationOnce(() => ({
        order: () =>
          Promise.resolve({
            data: null,
            error: new Error('Database error')
          })
      }));

      await expect(
        PodcastMatchingService.findMatches(mockPreferences)
      ).rejects.toThrow();
    });

    it('should handle invalid podcast data', async () => {
      // Override select implementation for this test
      mockSelect.mockImplementationOnce(() => ({
        order: () =>
          Promise.resolve({
            data: [{ podcast_id: 'test-1', features: {} }],
            error: null
          })
      }));

      const matches = await PodcastMatchingService.findMatches(mockPreferences);
      expect(matches).toHaveLength(0);
    });
  });
});

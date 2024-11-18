import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PodcastAnalysisService } from '@/services/podcast-analysis';
import { openaiClient } from '@/utils/openai';
import { createClient } from '@/utils/supabase/client';
import type { Podcast } from '@/types/podcast';
import type {
  PodcastFeatures,
  PodcastAnalysis
} from '@/types/podcast-analysis';

// Mock podcast data with required fields
const mockPodcast: Partial<Podcast> = {
  id: 'test-podcast-1',
  title: 'Test Podcast',
  description: 'A test podcast about technology',
  publisher: 'Test Publisher',
  image: 'test.jpg',
  categories: [{ id: 1, name: 'Technology' }],
  total_episodes: 100,
  language: 'English',
  website: 'https://test.com',
  listen_score: 80,
  explicit_content: false,
  latest_episode_id: 'ep1',
  latest_pub_date_ms: 1234567890
};

// Create complete features object
const mockFeatures: PodcastFeatures = {
  id: 'test-podcast-1',
  mainTopics: ['tech'],
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

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [mockPodcast], error: null })
      }),
      upsert: () => Promise.resolve({ error: null })
    })
  })
}));

describe('PodcastAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Extraction', () => {
    it('should extract features from podcast metadata', async () => {
      // Mock OpenAI response
      vi.mocked(openaiClient.processChatCompletion).mockResolvedValue(
        JSON.stringify({
          mainTopics: ['technology', 'programming'],
          contentStyle: {
            isInterview: true,
            isNarrative: false,
            isEducational: true,
            isDebate: false
          },
          complexityLevel: 'intermediate',
          productionQuality: 85,
          hostingStyle: ['professional', 'engaging'],
          languageComplexity: 70
        })
      );

      const features = await PodcastAnalysisService.extractFeatures(
        mockPodcast as Podcast
      );
      expect(features.mainTopics).toContain('technology');
    });

    it('should handle missing podcast data', async () => {
      const incompletePodcast: Partial<Podcast> = { ...mockPodcast };
      incompletePodcast.description = undefined;

      await expect(
        PodcastAnalysisService.extractFeatures(incompletePodcast as Podcast)
      ).rejects.toThrow();
    });
  });

  describe('Analysis Storage', () => {
    it('should store analysis results successfully', async () => {
      const analysis: PodcastAnalysis = {
        podcastId: 'test-podcast-1',
        features: mockFeatures,
        recentEpisodes: [],
        lastAnalyzed: new Date().toISOString(),
        analysisVersion: 'v1',
        confidence: 85
      };

      await expect(
        PodcastAnalysisService.storeAnalysis(analysis)
      ).resolves.not.toThrow();
    });
  });
});

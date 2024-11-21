import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Podcast } from '@/types/podcast';
import { PodcastAnalysisService } from '@/services/podcast-analysis';

// Mock process.env
vi.mock('process', () => ({
  env: { OPENAI_API_KEY: 'test-key' }
}));

// Mock OpenAI client
vi.mock('@/utils/openai', () => ({
  openaiClient: {
    processChatCompletion: vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              mainTopics: ['technology', 'software'],
              contentStyle: {
                isInterview: true,
                isNarrative: false,
                isEducational: true,
                isDebate: false
              },
              complexityLevel: 'intermediate',
              productionQuality: 85,
              hostingStyle: ['conversational'],
              languageComplexity: 0.7
            })
          }
        }
      ]
    })
  }
}));

describe('PodcastAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Extraction', () => {
    it('should extract features from podcast metadata', async () => {
      const mockPodcast: Partial<Podcast> = {
        id: 'test-podcast',
        title: 'Tech Talk',
        description: 'A podcast about technology and software development',
        categories: [
          { id: 1, name: 'technology' },
          { id: 2, name: 'software' }
        ],
        publisher: 'Tech Media',
        language: 'en',
        explicit_content: false,
        total_episodes: 100,
        average_duration: 45,
        publish_frequency: 'weekly',
        rating: 4.5,
        website: 'https://test.com',
        rss_feed: 'https://test.com/feed',
        image_url: 'https://test.com/image.jpg',
        status: 'active'
      };

      const features = await PodcastAnalysisService.extractFeatures(
        mockPodcast as Podcast
      );

      expect(features.mainTopics).toContain('technology');
      expect(features.contentStyle.isInterview).toBe(true);
      expect(features.complexityLevel).toBe('intermediate');
      expect(features.productionQuality).toBe(85);
    });
  });
});

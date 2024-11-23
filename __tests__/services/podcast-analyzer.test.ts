import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

// Define mock types
type MockData = {
  podcast?: any;
  analysis?: any;
};

// Mock Supabase module directly
vi.mock('@supabase/supabase-js', () => {
  const mockData: MockData = {};

  return {
    createClient: () => ({
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data:
                  table === 'podcasts' ? mockData.podcast : mockData.analysis,
                error: null
              })
          })
        }),
        upsert: () => Promise.resolve({ data: null, error: null })
      }),
      // Add mock setter for tests
      __setMockPodcast: (data: any) => {
        mockData.podcast = data;
      },
      __setMockAnalysis: (data: any) => {
        mockData.analysis = data;
      }
    })
  };
});

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  hostStyle: 'interview',
                  audienceLevel: 'expert',
                  topicDepth: 'deep',
                  guestRequirements: {
                    minimumExpertise: 'expert',
                    preferredTopics: ['AI', 'Blockchain'],
                    communicationPreference: ['Clear', 'Engaging']
                  },
                  topicalFocus: ['Technology', 'Innovation'],
                  confidence: 0.9
                })
              }
            }
          ]
        })
      }
    }
  }))
}));

// Import after mocks
import { PodcastAnalyzer } from '@/services/podcast-analyzer';
import { createClient } from '@supabase/supabase-js';

describe('PodcastAnalyzer', () => {
  const mockPodcast = {
    id: 'pod123',
    title: 'Tech Innovators',
    description: 'A podcast about technology and innovation',
    publisher: 'Tech Media Inc',
    language: 'en',
    categories: ['Technology', 'Business'],
    totalEpisodes: 100,
    averageEpisodeLength: 45,
    website: 'https://techinnovators.com',
    listenNotesUrl: 'https://listennotes.com/podcasts/tech-innovators'
  };

  const supabase = createClient('mock-url', 'mock-key');

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data
    (supabase as any).__setMockPodcast(mockPodcast);
    (supabase as any).__setMockAnalysis(null);
  });

  it('should return cached analysis if available and fresh', async () => {
    const mockCachedAnalysis = {
      podcast_id: 'pod123',
      host_style: 'interview',
      audience_level: 'expert',
      topic_depth: 'deep',
      guest_requirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['AI', 'Blockchain'],
        communicationPreference: ['Clear', 'Engaging']
      },
      topical_focus: ['Technology', 'Innovation'],
      confidence: 0.9,
      last_analyzed: new Date().toISOString()
    };

    (supabase as any).__setMockAnalysis(mockCachedAnalysis);

    const result = await PodcastAnalyzer.analyze('pod123');

    expect(result.analysis).toMatchObject({
      podcastId: 'pod123',
      hostStyle: 'interview',
      audienceLevel: 'expert',
      topicDepth: 'deep',
      guestRequirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['AI', 'Blockchain'],
        communicationPreference: ['Clear', 'Engaging']
      },
      topicalFocus: ['Technology', 'Innovation'],
      confidence: 0.9
    });
  });

  it('should perform new analysis if cache is stale', async () => {
    const staleCachedAnalysis = {
      podcast_id: 'pod123',
      host_style: 'interview',
      audience_level: 'expert',
      topic_depth: 'deep',
      guest_requirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['AI', 'Blockchain'],
        communicationPreference: ['Clear', 'Engaging']
      },
      topical_focus: ['Technology', 'Innovation'],
      confidence: 0.9,
      last_analyzed: new Date(
        Date.now() - 31 * 24 * 60 * 60 * 1000
      ).toISOString()
    };

    (supabase as any).__setMockAnalysis(staleCachedAnalysis);

    const result = await PodcastAnalyzer.analyze('pod123');

    expect(result.analysis).toMatchObject({
      podcastId: 'pod123',
      hostStyle: 'interview',
      audienceLevel: 'expert',
      topicDepth: 'deep',
      guestRequirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['AI', 'Blockchain'],
        communicationPreference: ['Clear', 'Engaging']
      },
      topicalFocus: ['Technology', 'Innovation'],
      confidence: 0.9
    });
  });

  it('should handle errors gracefully', async () => {
    (supabase as any).__setMockPodcast(null);

    await expect(PodcastAnalyzer.analyze('pod123')).rejects.toThrow(
      'Podcast not found'
    );
  });
});

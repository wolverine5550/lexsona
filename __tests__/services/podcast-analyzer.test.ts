import { PodcastAnalyzer } from '@/services/podcast-analyzer';
import { PodcastBase, EnhancedPodcast } from '@/types/podcast';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import OpenAI from 'openai';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn()
  }))
}));

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}));

describe('PodcastAnalyzer', () => {
  const mockPodcast: PodcastBase = {
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

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCachedAnalysis })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const result = await PodcastAnalyzer.analyze('pod123');

    expect(result).toMatchObject({
      ...mockPodcast,
      analysis: {
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
      }
    });
  });

  it('should perform new analysis if cache is stale', async () => {
    // Mock stale cached data
    const staleCachedAnalysis = {
      podcast_id: 'pod123',
      host_style: 'interview',
      audience_level: 'intermediate',
      topic_depth: 'moderate',
      guest_requirements: {
        minimumExpertise: 'intermediate',
        preferredTopics: ['Old Topic'],
        communicationPreference: ['Old Style']
      },
      topical_focus: ['Old Focus'],
      confidence: 0.8,
      last_analyzed: new Date(
        Date.now() - 31 * 24 * 60 * 60 * 1000
      ).toISOString() // 31 days old
    };

    // Mock new AI analysis results
    const newAnalysis = {
      hostStyle: 'educational',
      audienceLevel: 'expert',
      topicDepth: 'deep',
      guestRequirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['AI', 'Tech'],
        communicationPreference: ['Professional']
      },
      topicalFocus: ['Technology Trends'],
      confidence: 0.95
    };

    // Setup mocks
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: staleCachedAnalysis }) // First call for cache
            .mockResolvedValueOnce({ data: mockPodcast }) // Second call for podcast data
        })
      }),
      upsert: vi.fn().mockResolvedValue({ data: null })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    // Mock OpenAI response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(newAnalysis)
          }
        }
      ]
    } as any);

    const result = await PodcastAnalyzer.analyze('pod123');

    expect(result).toMatchObject({
      ...mockPodcast,
      analysis: {
        podcastId: 'pod123',
        ...newAnalysis
      }
    });
    expect(supabase.from).toHaveBeenCalledWith('podcast_analysis');
  });

  it('should handle errors gracefully', async () => {
    // Mock database error
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    await expect(PodcastAnalyzer.analyze('pod123')).rejects.toThrow(
      'Database error'
    );

    // Mock OpenAI error
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('OpenAI API error')
    );

    await expect(PodcastAnalyzer.analyze('pod123')).rejects.toThrow(
      'OpenAI API error'
    );
  });
});

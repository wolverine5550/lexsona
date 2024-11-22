import { MatchResultsProcessor } from '@/services/match-results-processor';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { MatchResult } from '@/types/matching';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, beforeEach, it, expect } from 'vitest';

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

describe('MatchResultsProcessor', () => {
  const mockAuthorAnalysis: AuthorAnalysis = {
    topics: ['technology', 'entrepreneurship'],
    expertiseLevel: 'expert',
    communicationStyle: 'professional',
    keyPoints: ['digital transformation', 'tech trends'],
    confidence: 0.9
  };

  const mockPodcastAnalysis: PodcastAnalysis = {
    podcastId: 'pod123',
    hostStyle: 'interview',
    audienceLevel: 'expert',
    topicDepth: 'deep',
    guestRequirements: {
      minimumExpertise: 'expert',
      preferredTopics: ['technology', 'innovation'],
      communicationPreference: ['professional']
    },
    topicalFocus: ['technology', 'startups'],
    confidence: 0.85,
    lastAnalyzed: new Date()
  };

  const mockMatchResult: MatchResult = {
    authorId: 'author123',
    podcastId: 'pod123',
    overallScore: 0.85,
    confidence: 0.9,
    breakdown: {
      topicScore: 0.9,
      expertiseScore: 0.8,
      styleScore: 0.85,
      audienceScore: 0.9,
      formatScore: 0.8,
      explanation: ['Good match']
    },
    suggestedTopics: ['tech']
  };

  const supabase = createClient('mock-url', 'mock-key');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process match results and generate detailed analysis', async () => {
    // Mock OpenAI responses for different prompts
    mockOpenAI.chat.completions.create.mockImplementation(
      async ({ messages }) => {
        const prompt = messages[0].content;
        let response;

        if (prompt.includes('topic suggestions')) {
          response = [
            {
              topic: 'Technology Trends',
              relevance: 0.9,
              authorExpertise: 0.85,
              audienceInterest: 0.9,
              explanation: 'Perfect alignment with podcast focus'
            }
          ];
        } else if (prompt.includes('episode ideas')) {
          response = [
            {
              title: 'Future of Tech',
              description: 'Exploring emerging technologies',
              keyPoints: ['AI', 'Blockchain', 'IoT'],
              relevanceScore: 0.9,
              targetAudience: ['Tech professionals', 'Entrepreneurs']
            }
          ];
        } else {
          response = {
            strengths: ['Strong topic alignment'],
            considerations: ['Technical depth consideration'],
            recommendations: ['Focus on practical examples']
          };
        }

        return {
          choices: [
            {
              message: {
                content: JSON.stringify(response)
              }
            }
          ]
        } as any;
      }
    );

    // Mock Supabase cache operations
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const result = await MatchResultsProcessor.processMatch(
      mockMatchResult,
      mockAuthorAnalysis,
      mockPodcastAnalysis
    );

    // Verify the structure and content of the result
    expect(result.matchId).toBe(
      `match_${mockMatchResult.authorId}_${mockMatchResult.podcastId}`
    );
    expect(result.overallScore).toBe(mockMatchResult.overallScore);
    expect(result.confidence).toBe(mockMatchResult.confidence);

    // Verify detailed components
    expect(result.suggestedTopics[0].topic).toBe('Technology Trends');
    expect(result.potentialEpisodes[0].title).toBe('Future of Tech');
    expect(result.explanations.strengths).toContain('Strong topic alignment');

    // Verify caching
    expect(supabase.from).toHaveBeenCalledWith('match_results');
  });

  it('should handle errors in analysis generation', async () => {
    // Mock OpenAI error
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('OpenAI API error')
    );

    await expect(
      MatchResultsProcessor.processMatch(
        mockMatchResult,
        mockAuthorAnalysis,
        mockPodcastAnalysis
      )
    ).rejects.toThrow('Failed to process match result');
  });

  it('should validate and sanitize AI responses', async () => {
    // Mock invalid/incomplete OpenAI response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: '{}'
          }
        }
      ]
    } as any);

    const result = await MatchResultsProcessor.processMatch(
      mockMatchResult,
      mockAuthorAnalysis,
      mockPodcastAnalysis
    );

    // Verify fallback/default values are used
    expect(result.suggestedTopics).toEqual([]);
    expect(result.potentialEpisodes).toEqual([]);
    expect(result.explanations.strengths).toEqual([]);
  });
});

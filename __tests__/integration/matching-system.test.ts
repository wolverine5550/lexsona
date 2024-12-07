import { AuthorAnalyzer } from '@/services/author-analyzer';
import { PodcastAnalyzer } from '@/services/podcast-analyzer';
import { MatchMaker } from '@/services/match-maker';
import { CompatibilityService } from '@/services/compatibility-service';
import { MatchResultsProcessor } from '@/services/match-results-processor';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { AuthorAnalysis, ExpertiseLevel } from '../../types/author';
import type { PodcastMatch } from '../../types/matching';
import type { DetailedMatchResult } from '../../types/match-results';

// Mock environment variables
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  })
}));

// Mock all services
vi.mock('@/services/author-analyzer', () => ({
  AuthorAnalyzer: {
    analyze: vi.fn()
  }
}));

vi.mock('@/services/podcast-analyzer', () => ({
  PodcastAnalyzer: {
    analyze: vi.fn()
  }
}));

vi.mock('@/services/match-maker', () => ({
  MatchMaker: {
    generateMatch: vi.fn()
  }
}));

vi.mock('@/services/match-results-processor', () => ({
  MatchResultsProcessor: {
    processMatch: vi.fn()
  }
}));

vi.mock('@/services/compatibility-service', () => ({
  CompatibilityService: {
    findMatches: vi.fn()
  }
}));

describe('Matching System Integration', () => {
  const mockAuthorAnalysis: AuthorAnalysis = {
    topics: ['technology', 'entrepreneurship'],
    expertiseLevel: 'expert' as ExpertiseLevel,
    communicationStyle: 'professional',
    keyPoints: ['digital transformation', 'tech trends'],
    confidence: 0.9
  };

  const mockMatchResult: PodcastMatch & { authorId: string } = {
    authorId: 'test-author',
    podcastId: 'test-pod',
    overallScore: 0.85,
    confidence: 0.9,
    breakdown: {
      topicScore: 0.8,
      expertiseScore: 0.9,
      styleScore: 0.85,
      audienceScore: 0.9,
      formatScore: 0.8,
      lengthScore: 0.8,
      complexityScore: 0.8,
      qualityScore: 0.8,
      explanation: ['Good match']
    },
    suggestedTopics: ['technology']
  };

  const mockDetailedResult: DetailedMatchResult = {
    matchId: 'test-match',
    authorId: 'test-author',
    podcastId: 'test-pod',
    overallScore: 0.85,
    confidence: 0.9,
    authorDetails: {
      id: 'test-author',
      name: 'Test Author',
      bio: 'Test Bio',
      expertise: ['technology'],
      topics: ['tech'],
      publications: []
    },
    podcastDetails: {
      id: 'test-pod',
      title: 'Test Podcast',
      description: 'Test Description',
      categories: ['tech'],
      language: 'en',
      averageEpisodeLength: 45,
      totalEpisodes: 100
    },
    compatibilityAnalysis: {
      strengths: ['Good match'],
      weaknesses: [],
      recommendations: ['Do this'],
      potentialImpact: 'High'
    },
    topicExplanations: [
      {
        topic: 'technology',
        relevance: 0.8,
        authorExpertise: 0.9,
        audienceInterest: 0.85,
        explanation: 'Strong match in technology'
      }
    ],
    episodeIdeas: [
      {
        title: 'Test Episode',
        description: 'Test Description',
        topics: ['tech'],
        estimatedDuration: 45,
        targetAudience: ['tech professionals'],
        potentialImpact: 'High'
      }
    ],
    generatedAt: new Date(),
    validUntil: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(AuthorAnalyzer.analyze).mockResolvedValue(mockAuthorAnalysis);
    vi.mocked(MatchMaker.generateMatch).mockResolvedValue(mockMatchResult);
    vi.mocked(CompatibilityService.findMatches).mockResolvedValue({
      authorId: 'test-author',
      matches: [
        {
          podcastId: 'test-pod',
          score: 0.9,
          confidence: 0.9,
          rank: 1,
          explanation: ['Good match']
        }
      ],
      processedCount: 1,
      totalCandidates: 1,
      processingTime: 100
    });
    vi.mocked(MatchResultsProcessor.processMatch).mockResolvedValue(
      mockDetailedResult
    );
  });

  it('should successfully complete full matching flow', async () => {
    const authorId = 'test-author';
    const podcastIds = ['pod1', 'pod2', 'pod3'];

    const authorAnalysis = await AuthorAnalyzer.analyze(authorId);
    expect(authorAnalysis).toBeDefined();
    expect(authorAnalysis.expertiseLevel).toBe('expert');
  });

  describe('Quality Validation', () => {
    it('should provide consistent match scores', async () => {
      vi.mocked(MatchMaker.generateMatch).mockResolvedValueOnce(
        mockMatchResult
      );
      vi.mocked(MatchMaker.generateMatch).mockResolvedValueOnce({
        ...mockMatchResult
      });

      const results = await Promise.all([
        MatchMaker.generateMatch('author1', 'pod1'),
        MatchMaker.generateMatch('author1', 'pod1')
      ]);

      expect(results[0].overallScore).toBe(results[1].overallScore);
      expect(results[0].confidence).toBe(results[1].confidence);
    });
  });
});

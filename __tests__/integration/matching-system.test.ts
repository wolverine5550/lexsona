import { AuthorAnalyzer } from '@/services/author-analyzer';
import { PodcastAnalyzer } from '@/services/podcast-analyzer';
import { MatchMaker } from '@/services/match-maker';
import { CompatibilityService } from '@/services/compatibility-service';
import { MatchResultsProcessor } from '@/services/match-results-processor';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { TestHelpers } from '../utils/test-helpers';
import OpenAI from 'openai';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis, EnhancedPodcast } from '@/types/podcast';
import { DetailedMatchResult } from '@/types/match-results';

// Mock external dependencies
vi.mock('@supabase/supabase-js');
vi.mock('openai');
vi.mock('@/services/author-analyzer');
vi.mock('@/services/podcast-analyzer');
vi.mock('@/services/match-maker');

// Create mock Supabase client
const mockSupabase = createClient('mock-url', 'mock-key');

describe('Matching System Integration', () => {
  // Create mock analysis data (not profile data)
  const mockAuthorAnalysis: AuthorAnalysis = {
    topics: ['technology', 'entrepreneurship'],
    expertiseLevel: 'expert',
    communicationStyle: 'professional',
    keyPoints: ['digital transformation', 'tech trends'],
    confidence: 0.9
  };

  const mockPodcastAnalysis = TestHelpers.createMockPodcastAnalysis();
  const mockMatchResult = TestHelpers.createMockMatchResult();

  // Create mock enhanced podcast
  const mockEnhancedPodcast: EnhancedPodcast = {
    id: 'pod123',
    title: 'Test Podcast',
    description: 'Test Description',
    publisher: 'Test Publisher',
    language: 'en',
    categories: ['Technology'],
    totalEpisodes: 100,
    averageEpisodeLength: 60,
    website: 'https://test.com',
    listenNotesUrl: 'https://listennotes.com/test',
    analysis: mockPodcastAnalysis
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks with proper return types
    vi.mocked(AuthorAnalyzer.analyze).mockResolvedValue(mockAuthorAnalysis);
    vi.mocked(PodcastAnalyzer.analyze).mockResolvedValue(mockEnhancedPodcast);
    vi.mocked(MatchMaker.generateMatch).mockResolvedValue(mockMatchResult);
  });

  it('should successfully complete full matching flow', async () => {
    // Setup test data
    const authorId = 'test-author';
    const podcastIds = ['pod1', 'pod2', 'pod3'];

    // 1. Author Analysis
    const authorAnalysis = await AuthorAnalyzer.analyze(authorId);
    expect(authorAnalysis).toBeDefined();
    expect(authorAnalysis.expertiseLevel).toBe('expert');

    // 2. Podcast Analysis
    const podcastAnalyses = await Promise.all(
      podcastIds.map((id) => PodcastAnalyzer.analyze(id))
    );
    expect(podcastAnalyses).toHaveLength(3);

    // 3. Initial Matching
    const matches = await Promise.all(
      podcastIds.map((id) => MatchMaker.generateMatch(authorId, id))
    );
    expect(matches).toHaveLength(3);

    // 4. Compatibility Processing
    const compatibilityResults = await CompatibilityService.findMatches(
      authorId,
      { minScore: 0.7 }
    );
    expect(compatibilityResults.matches).toBeDefined();

    // 5. Detailed Results Processing
    const detailedResults = await MatchResultsProcessor.processMatch(
      matches[0],
      authorAnalysis,
      podcastAnalyses[0].analysis!
    );
    expect(detailedResults.suggestedTopics).toBeDefined();
  });

  describe('Match Quality Validation', () => {
    it('should provide relevant episode suggestions', async () => {
      const mockDetailedResult: DetailedMatchResult = {
        matchId: 'test-match',
        authorId: 'test-author',
        podcastId: 'test-pod',
        overallScore: 0.85,
        confidence: 0.9,
        compatibility: {
          topicAlignment: 0.8,
          expertiseMatch: 0.9,
          styleCompatibility: 0.85,
          audienceMatch: 0.9,
          formatSuitability: 0.8
        },
        explanations: {
          strengths: ['Good match'],
          considerations: ['Consider this'],
          recommendations: ['Do this']
        },
        suggestedTopics: [],
        potentialEpisodes: [
          {
            title: 'Test Episode',
            description: 'Test Description',
            keyPoints: ['point1', 'point2'],
            relevanceScore: 0.8,
            targetAudience: ['tech professionals']
          }
        ],
        generatedAt: new Date(),
        validUntil: new Date()
      };

      vi.mocked(MatchResultsProcessor.processMatch).mockResolvedValue(
        mockDetailedResult
      );

      const result = await MatchResultsProcessor.processMatch(
        mockMatchResult,
        mockAuthorAnalysis,
        mockPodcastAnalysis
      );

      expect(result.potentialEpisodes[0].relevanceScore).toBeGreaterThan(0.7);
      expect(result.potentialEpisodes[0].keyPoints.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Batch Processing', () => {
    it('should handle empty podcast list gracefully', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
            data: []
          })
        })
      });

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

      const result = await CompatibilityService.findMatches('test-author');
      expect(result.matches).toHaveLength(0);
      expect(result.processedCount).toBe(0);
    });

    it('should handle very large batch sizes efficiently', async () => {
      const largeBatchSize = 100;
      const mockPodcasts = Array.from({ length: largeBatchSize }, (_, i) => ({
        podcastId: `pod${i}`,
        ...mockEnhancedPodcast
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
            data: mockPodcasts
          })
        })
      });

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

      const startTime = performance.now();
      const result = await CompatibilityService.findMatches('test-author');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(largeBatchSize * 100);
      expect(result.processedCount).toBe(largeBatchSize);
    });

    it('should maintain match quality under load', async () => {
      const batchSize = 50;
      const mockPodcasts = Array.from({ length: batchSize }, (_, i) => ({
        podcastId: `pod${i}`,
        ...mockEnhancedPodcast
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
            data: mockPodcasts
          })
        })
      });

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

      const result = await CompatibilityService.findMatches('test-author');

      result.matches.forEach((match) => {
        expect(match.score).toBeGreaterThan(0.6);
        expect(match.confidence).toBeGreaterThan(0.7);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete analysis within time budget', async () => {
      const startTime = performance.now();

      await AuthorAnalyzer.analyze('test-author');
      const analysisTime = performance.now() - startTime;

      expect(analysisTime).toBeLessThan(2000); // Max 2 seconds for analysis
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const startTime = performance.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        CompatibilityService.findMatches('test-author', { maxResults: 10 })
      );

      const results = await Promise.all(requests);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // Max 5 seconds for all requests
      results.forEach((result) => {
        expect(result.matches.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Quality Validation', () => {
    it('should provide consistent match scores', async () => {
      const results = await Promise.all([
        MatchMaker.generateMatch('author1', 'pod1'),
        MatchMaker.generateMatch('author1', 'pod1')
      ]);

      expect(results[0].overallScore).toBe(results[1].overallScore);
      expect(results[0].confidence).toBe(results[1].confidence);
    });

    it('should generate relevant episode suggestions', async () => {
      const result = await MatchResultsProcessor.processMatch(
        mockMatchResult,
        mockAuthorAnalysis,
        mockPodcastAnalysis
      );

      result.potentialEpisodes.forEach((episode) => {
        expect(episode.title).toBeTruthy();
        expect(episode.description).toBeTruthy();
        expect(episode.keyPoints.length).toBeGreaterThan(2);
        expect(episode.relevanceScore).toBeGreaterThan(0.7);
      });
    });
  });
});

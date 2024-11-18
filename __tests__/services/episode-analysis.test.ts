import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EpisodeAnalysisService } from '@/services/episode-analysis';
import { openaiClient } from '@/utils/openai';
import { createClient } from '@/utils/supabase/client';
import type {
  PostgrestSingleResponse,
  PostgrestError,
  SupabaseClient
} from '@supabase/supabase-js';

// Create proper PostgrestError
const mockPostgrestError: PostgrestError = {
  message: 'Not found',
  details: 'Episode not found',
  hint: '',
  code: 'PGRST116'
};

// Create type-safe mock response
const mockEpisodeResponse: PostgrestSingleResponse<any> = {
  data: {
    id: 'test-episode-1',
    title: 'Test Episode',
    description: 'Test description',
    transcript: 'Test transcript',
    published_at: '2024-01-01',
    episode_number: 1
  },
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
};

// Mock OpenAI client
vi.mock('@/utils/openai', () => ({
  openaiClient: {
    processChatCompletion: vi.fn()
  }
}));

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve(mockEpisodeResponse)
        })
      })
    })
  })
}));

describe('EpisodeAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeEpisodes', () => {
    it('should analyze multiple episodes successfully', async () => {
      // Mock OpenAI response
      vi.mocked(openaiClient.processChatCompletion).mockResolvedValue(
        JSON.stringify({
          topics: ['technology', 'AI'],
          keyPoints: ['Point 1', 'Point 2'],
          guestExperts: ['Expert 1'],
          contentType: ['interview'],
          confidence: 85
        })
      );

      const results = await EpisodeAnalysisService.analyzeEpisodes(
        'test-podcast',
        ['episode-1', 'episode-2']
      );

      expect(results).toHaveLength(2);
      expect(results[0]?.topics).toContain('technology');
      expect(openaiClient.processChatCompletion).toHaveBeenCalledTimes(2);
    });

    it('should limit number of episodes analyzed', async () => {
      const manyEpisodes = Array(10)
        .fill('')
        .map((_, i) => `episode-${i}`);

      await EpisodeAnalysisService.analyzeEpisodes(
        'test-podcast',
        manyEpisodes
      );

      // Should only process MAX_EPISODES
      expect(openaiClient.processChatCompletion).toHaveBeenCalledTimes(5);
    });

    it('should handle failed analyses gracefully', async () => {
      // Mock one success, one failure
      vi.mocked(openaiClient.processChatCompletion)
        .mockResolvedValueOnce(
          JSON.stringify({
            topics: ['tech'],
            keyPoints: ['point'],
            contentType: ['interview'],
            confidence: 90
          })
        )
        .mockRejectedValueOnce(new Error('Analysis failed'));

      const results = await EpisodeAnalysisService.analyzeEpisodes(
        'test-podcast',
        ['episode-1', 'episode-2']
      );

      expect(results).toHaveLength(1); // Only successful analysis
      expect(results[0]?.topics).toContain('tech');
    });
  });

  describe('Confidence Scoring', () => {
    it('should reject low confidence analyses', async () => {
      vi.mocked(openaiClient.processChatCompletion).mockResolvedValue(
        JSON.stringify({
          topics: ['tech'],
          keyPoints: ['point'],
          contentType: ['interview'],
          confidence: 50 // Below minimum
        })
      );

      const results = await EpisodeAnalysisService.analyzeEpisodes(
        'test-podcast',
        ['episode-1']
      );

      expect(results).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing episode data', async () => {
      const notFoundResponse: PostgrestSingleResponse<any> = {
        data: null,
        error: mockPostgrestError,
        count: null,
        status: 404,
        statusText: 'Not Found'
      };

      // Create a partial mock that satisfies SupabaseClient type
      const mockErrorClient = {
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve(notFoundResponse)
            })
          })
        }),
        // Add required minimal SupabaseClient properties
        supabaseUrl: 'http://localhost',
        supabaseKey: 'test-key',
        auth: {},
        realtime: {},
        rest: {},
        headers: {},
        storage: {} as any,
        functions: {} as any
      } as unknown as SupabaseClient;

      vi.mocked(createClient).mockImplementationOnce(() => mockErrorClient);

      const results = await EpisodeAnalysisService.analyzeEpisodes(
        'test-podcast',
        ['missing-episode']
      );

      expect(results).toHaveLength(0);
    });

    it('should handle malformed OpenAI responses', async () => {
      // Mock invalid JSON response
      vi.mocked(openaiClient.processChatCompletion).mockResolvedValue(
        'Invalid JSON'
      );

      const results = await EpisodeAnalysisService.analyzeEpisodes(
        'test-podcast',
        ['episode-1']
      );

      expect(results).toHaveLength(0);
    });
  });
});

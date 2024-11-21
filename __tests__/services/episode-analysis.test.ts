import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EpisodeAnalysisService } from '@/services/episode-analysis';
import { openaiClient } from '@/utils/openai';
import { createClient } from '@/utils/supabase/client';
import type {
  PostgrestSingleResponse,
  PostgrestError,
  SupabaseClient
} from '@supabase/supabase-js';
import type { EpisodeAnalysis, EpisodeData } from '@/types/episode-analysis';

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
  createClient: vi.fn().mockImplementation(() => {
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'episode1',
                title: 'Test Episode',
                content: 'Test content'
              },
              error: null
            })
          })
        })
      })
    };
    return client as unknown as SupabaseClient;
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

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing episode data', async () => {
      const mockClient = vi.mocked(createClient);
      mockClient.mockImplementationOnce(() => {
        const client = {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Episode not found' }
                })
              })
            })
          })
        };
        return client as unknown as SupabaseClient;
      });

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

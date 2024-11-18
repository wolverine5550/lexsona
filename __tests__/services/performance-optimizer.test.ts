import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PerformanceOptimizer } from '@/services/performance-optimizer';
import type { PodcastMatch } from '@/types/podcast';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        }),
        single: mockSingle
      }),
      order: mockOrder.mockReturnValue({
        range: mockRange
      })
    })
  })
};

// Mock OpenAI
const mockCreateChatCompletion = vi.fn();
const mockOpenAI = {
  createChatCompletion: mockCreateChatCompletion
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

vi.mock('openai', () => ({
  Configuration: vi.fn(),
  OpenAIApi: vi.fn(() => mockOpenAI)
}));

describe('PerformanceOptimizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Batch Processing', () => {
    it('should process recommendations in batches', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      const mockRecommendations: PodcastMatch[] = [
        { podcast: 'pod1', score: 0.8, matchReason: 'test' }
      ];

      mockLimit.mockResolvedValue(mockRecommendations);

      const results =
        await PerformanceOptimizer.batchProcessRecommendations(userIds);

      expect(Object.keys(results)).toHaveLength(userIds.length);
      expect(results.user1).toEqual(mockRecommendations);
    });
  });

  describe('Streaming', () => {
    it('should stream recommendations', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { preferences: {} },
        error: null
      });

      mockRange.mockResolvedValueOnce({
        data: [
          { id: 'pod1', title: 'Test Podcast' },
          { id: 'pod2', title: 'Another Podcast' }
        ],
        error: null
      });

      mockCreateChatCompletion.mockResolvedValue({
        data: {
          choices: [{ message: { content: '0.8' } }]
        }
      });

      const generator = PerformanceOptimizer.streamRecommendations('user1');
      const firstBatch = await generator.next();

      expect(firstBatch.value).toBeDefined();
      expect(Array.isArray(firstBatch.value)).toBe(true);
    });
  });

  describe('Query Optimization', () => {
    it('should use materialized views for faster querying', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [{ podcast_id: 'pod1', match_score: 0.8 }],
        error: null
      });

      const recommendations =
        await PerformanceOptimizer['getRecommendationsForUser']('user1');

      expect(mockSupabase.from).toHaveBeenCalledWith(
        'podcast_recommendations_mv'
      );
      expect(recommendations).toHaveLength(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should process large batches efficiently', async () => {
      const userIds = Array.from({ length: 100 }, (_, i) => `user${i}`);
      const startTime = Date.now();

      mockLimit.mockResolvedValue([]);

      await PerformanceOptimizer.batchProcessRecommendations(userIds);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

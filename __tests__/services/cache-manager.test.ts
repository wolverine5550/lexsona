import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '@/services/cache-manager';
import { createClient } from '@/utils/supabase/client';
import type { OpenAICacheKey, AnalysisCacheKey } from '@/types/cache';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle
      })
    }),
    upsert: mockUpsert,
    delete: mockDelete
  }))
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('CacheManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CacheManager.initialize();
  });

  describe('OpenAI Cache', () => {
    const mockOpenAIKey: OpenAICacheKey = {
      prompt: 'test prompt',
      model: 'gpt-4',
      temperature: 0.7
    };

    it('should cache OpenAI responses', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });

      await CacheManager.cacheOpenAIResponse(mockOpenAIKey, 'test response');
      expect(mockSupabase.from).toHaveBeenCalledWith('openai_cache');
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should retrieve cached OpenAI responses', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          entry: {
            response: 'cached response',
            timestamp: Date.now(),
            expiresAt: Date.now() + 1000000,
            usageCount: 1
          }
        },
        error: null
      });

      const response = await CacheManager.getOpenAIResponse(mockOpenAIKey);
      expect(response).toBe('cached response');
    });

    it('should handle expired OpenAI cache entries', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          entry: {
            response: 'expired response',
            timestamp: Date.now() - 1000000,
            expiresAt: Date.now() - 1000,
            usageCount: 1
          }
        },
        error: null
      });

      mockDelete.mockResolvedValueOnce({ error: null });

      const response = await CacheManager.getOpenAIResponse(mockOpenAIKey);
      expect(response).toBeNull();
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors', async () => {
      mockUpsert.mockResolvedValueOnce({
        error: new Error('Storage error')
      });

      await expect(
        CacheManager.cacheOpenAIResponse(
          { prompt: 'test', model: 'gpt-4' },
          'response'
        )
      ).rejects.toThrow('Failed to cache OpenAI response');
    });

    it('should handle retrieval errors', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Retrieval error')
      });

      await expect(
        CacheManager.getOpenAIResponse({ prompt: 'test', model: 'gpt-4' })
      ).rejects.toThrow('Failed to retrieve OpenAI response');
    });
  });
});

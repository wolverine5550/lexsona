import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '@/services/cache-manager';
import type { OpenAICacheKey } from '@/types/cache';

// Mock Supabase client
const mockFrom = vi.fn();
const mockUpsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom.mockReturnValue({
      upsert: mockUpsert,
      select: mockSelect.mockReturnValue({
        eq: mockEq
      })
    })
  })
}));

describe('CacheManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CacheManager.initialize();
  });

  describe('Error Handling', () => {
    it('should handle storage errors', async () => {
      // Mock a storage error
      mockUpsert.mockResolvedValueOnce({
        error: new Error('Storage error')
      });

      const mockKey: OpenAICacheKey = {
        prompt: 'test prompt',
        model: 'gpt-4'
      };

      await expect(
        CacheManager.cacheOpenAIResponse(mockKey, 'response')
      ).rejects.toThrow('Failed to cache OpenAI response');
    });

    it('should handle retrieval errors', async () => {
      mockEq.mockResolvedValueOnce({
        data: null,
        error: new Error('Retrieval error')
      });

      await expect(
        CacheManager.getOpenAIResponse({
          prompt: 'test',
          model: 'gpt-4'
        })
      ).rejects.toThrow('Failed to retrieve OpenAI response');
    });
  });
});

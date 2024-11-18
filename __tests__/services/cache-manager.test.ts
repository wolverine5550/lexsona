import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '@/services/cache-manager';
import { createClient } from '@/utils/supabase/client';
import type { OpenAICacheKey, AnalysisCacheKey } from '@/types/cache';

// Mock Supabase client with vitest mock functions
// These mocks simulate Supabase's query builder pattern
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();

// Create a mock Supabase instance that returns chainable mock functions
// This mirrors Supabase's actual client structure but with controlled responses
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

// Mock the Supabase client creation to return our mock instance
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('CacheManager', () => {
  // Reset all mocks before each test to ensure clean state
  beforeEach(() => {
    vi.clearAllMocks();
    CacheManager.initialize();
  });

  describe('OpenAI Cache', () => {
    // Sample cache key for testing OpenAI-related cache operations
    const mockOpenAIKey: OpenAICacheKey = {
      prompt: 'test prompt',
      model: 'gpt-4',
      temperature: 0.7
    };

    // Test case: Verify that responses are properly cached
    it('should cache OpenAI responses', async () => {
      // Mock successful upsert operation
      mockUpsert.mockResolvedValueOnce({ error: null });

      await CacheManager.cacheOpenAIResponse(mockOpenAIKey, 'test response');
      // Verify correct table is targeted
      expect(mockSupabase.from).toHaveBeenCalledWith('openai_cache');
      // Verify upsert operation was called
      expect(mockUpsert).toHaveBeenCalled();
    });

    // Test case: Verify retrieval of cached responses
    it('should retrieve cached OpenAI responses', async () => {
      // Mock successful cache hit with valid entry
      mockSingle.mockResolvedValueOnce({
        data: {
          entry: {
            response: 'cached response',
            timestamp: Date.now(),
            expiresAt: Date.now() + 1000000, // Future expiration
            usageCount: 1
          }
        },
        error: null
      });

      const response = await CacheManager.getOpenAIResponse(mockOpenAIKey);
      expect(response).toBe('cached response');
    });

    // Test case: Verify handling of expired cache entries
    it('should handle expired OpenAI cache entries', async () => {
      // Mock cache hit with expired entry
      mockSingle.mockResolvedValueOnce({
        data: {
          entry: {
            response: 'expired response',
            timestamp: Date.now() - 1000000,
            expiresAt: Date.now() - 1000, // Past expiration
            usageCount: 1
          }
        },
        error: null
      });

      // Mock successful deletion of expired entry
      mockDelete.mockResolvedValueOnce({ error: null });

      const response = await CacheManager.getOpenAIResponse(mockOpenAIKey);
      // Expect null response for expired entry
      expect(response).toBeNull();
      // Verify expired entry was deleted
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    // Test case: Verify proper handling of storage errors
    it('should handle storage errors', async () => {
      // Mock storage operation failure
      mockUpsert.mockResolvedValueOnce({
        error: new Error('Storage error')
      });

      // Verify error is properly propagated
      await expect(
        CacheManager.cacheOpenAIResponse(
          { prompt: 'test', model: 'gpt-4' },
          'response'
        )
      ).rejects.toThrow('Failed to cache OpenAI response');
    });

    // Test case: Verify proper handling of retrieval errors
    it('should handle retrieval errors', async () => {
      // Mock retrieval operation failure
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Retrieval error')
      });

      // Verify error is properly propagated
      await expect(
        CacheManager.getOpenAIResponse({ prompt: 'test', model: 'gpt-4' })
      ).rejects.toThrow('Failed to retrieve OpenAI response');
    });
  });
});

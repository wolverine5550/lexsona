import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler } from '@/services/error-handler';
import type { ErrorSeverity } from '@/services/error-handler';

// Mock Supabase client
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

// Simplified mock structure to avoid nesting issues
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle
      }),
      in: mockIn.mockReturnValue({
        order: mockOrder.mockReturnValue({
          limit: mockLimit
        })
      }),
      order: mockOrder.mockReturnValue({
        limit: mockLimit
      })
    })
  })
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Reporting', () => {
    it('should log errors to database', async () => {
      const testError = new Error('Test error');
      const severity: ErrorSeverity = 'medium';

      mockInsert.mockResolvedValueOnce({ error: null });

      await ErrorHandler.reportError(testError, severity, { userId: 'user1' });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockInsert.mock.calls[0][0]).toMatchObject({
        errorType: 'Error',
        message: 'Test error',
        severity: 'medium'
      });
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      const operation = vi.fn();
      operation
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValueOnce('success');

      mockInsert.mockResolvedValue({ error: null });

      const result = await ErrorHandler.withRetry(operation, {
        name: 'testOperation',
        userId: 'user1'
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

      mockInsert.mockResolvedValue({ error: null });

      await expect(
        ErrorHandler.withRetry(operation, {
          name: 'testOperation',
          userId: 'user1'
        })
      ).rejects.toThrow('Always fails');
    });
  });

  describe('Fallback Recommendations', () => {
    it('should return user-specific recommendations when available', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { topicWeights: { technology: 0.8 } },
        error: null
      });

      mockLimit.mockResolvedValueOnce({
        data: [{ id: 1, title: 'Tech Podcast' }],
        error: null
      });

      const recommendations =
        await ErrorHandler.getFallbackRecommendations('user1');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toBe('Tech Podcast');
    });

    it('should fall back to popular podcasts when user preferences unavailable', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      mockLimit.mockResolvedValueOnce({
        data: [{ id: 1, title: 'Popular Podcast' }],
        error: null
      });

      const recommendations =
        await ErrorHandler.getFallbackRecommendations('user1');

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toBe('Popular Podcast');
    });

    it('should return empty array as last resort', async () => {
      mockSingle.mockRejectedValueOnce(new Error('Database error'));
      mockInsert.mockResolvedValueOnce({ error: null });

      const recommendations =
        await ErrorHandler.getFallbackRecommendations('user1');

      expect(recommendations).toHaveLength(0);
    });
  });
});

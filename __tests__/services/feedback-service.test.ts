import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackService } from '@/services/feedback-service';
import { FeedbackType } from '@/types/feedback';
import type { FeedbackDetails, UserInteraction } from '@/types/feedback';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Mock } from 'vitest';

interface MockSupabaseResponse {
  data: any;
  error: null;
}

// Mock the Supabase client module first
vi.mock('@/utils/supabase/client', () => {
  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  });

  const mockUpsert = vi
    .fn()
    .mockImplementation((data): Promise<MockSupabaseResponse> => {
      return Promise.resolve({ data, error: null });
    });

  const mockInsert = vi
    .fn()
    .mockImplementation((data): Promise<MockSupabaseResponse> => {
      return Promise.resolve({ data, error: null });
    });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
    insert: mockInsert
  });

  return {
    createClient: (): Partial<SupabaseClient> => ({
      from: mockFrom
    })
  };
});

describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feedback Management', () => {
    const mockFeedback: FeedbackDetails = {
      id: 'feedback-1',
      userId: 'user1',
      podcastId: 'pod1',
      feedbackType: FeedbackType.RELEVANCE,
      rating: 5,
      comment: 'Great podcast!',
      timestamp: new Date().toISOString(),
      isProcessed: false,
      categories: ['technology'],
      metadata: {
        podcastStyle: 'interview'
      }
    };

    it('should store valid feedback', async () => {
      await expect(
        FeedbackService.storeFeedback(mockFeedback)
      ).resolves.not.toThrow();

      const mockFrom = vi.mocked(FeedbackService['supabase'].from) as Mock;
      const mockUpsert = mockFrom().upsert as Mock;

      expect(mockFrom).toHaveBeenCalledWith('feedback');
      expect(mockUpsert.mock.calls.length).toBeGreaterThan(0);

      // Omit timestamp from comparison
      const { timestamp, ...feedbackWithoutTimestamp } = mockFeedback;
      expect(mockUpsert.mock.calls[0][0]).toMatchObject({
        ...feedbackWithoutTimestamp,
        timestamp: expect.any(String)
      });

      // Check metrics update
      expect(mockFrom).toHaveBeenCalledWith('feedback_metrics');
      expect(mockUpsert.mock.calls[1][0]).toMatchObject({
        podcastId: mockFeedback.podcastId,
        totalInteractions: expect.any(Number),
        lastUpdated: expect.any(String)
      });
    });
  });

  describe('Interaction Recording', () => {
    const mockInteraction: UserInteraction = {
      id: 'interaction-1',
      userId: 'user1',
      podcastId: 'pod1',
      interactionType: FeedbackType.RELEVANCE,
      timestamp: new Date().toISOString(),
      metadata: { source: 'search' }
    };

    it('should record valid interaction', async () => {
      await expect(
        FeedbackService.recordInteraction(mockInteraction)
      ).resolves.not.toThrow();

      const mockFrom = vi.mocked(FeedbackService['supabase'].from) as Mock;
      const mockInsert = mockFrom().insert as Mock;

      expect(mockFrom).toHaveBeenCalledWith('user_interactions');
      expect(mockInsert.mock.calls.length).toBeGreaterThan(0);
      expect(mockInsert.mock.calls[0][0]).toMatchObject({
        ...mockInteraction
      });
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createSupabaseMock } from '../mocks/supabase';
import { createClient } from '@/utils/supabase/client';

// Set up mock before importing service
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

// Import service and types after mock setup
import { FeedbackService } from '@/services/feedback-service';
import { FeedbackType } from '@/types/feedback';
import type { FeedbackDetails, UserInteraction } from '@/types/feedback';

describe('FeedbackService', () => {
  const { mockClient, mockFrom, mockUpsert, mockInsert } = createSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set the static supabase property
    Object.defineProperty(FeedbackService, 'supabase', {
      value: mockClient,
      writable: true
    });
  });

  describe('Feedback Management', () => {
    const mockFeedback: FeedbackDetails = {
      id: 'feedback-1',
      userId: 'user1',
      podcastId: 'pod1',
      feedbackType: FeedbackType.RELEVANCE,
      rating: 5,
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

      expect(mockFrom).toHaveBeenCalledWith('feedback');
      expect(mockUpsert).toHaveBeenCalled();
    });
  });

  describe('Interaction Recording', () => {
    const mockInteraction: UserInteraction = {
      id: 'interaction-1',
      userId: 'user1',
      podcastId: 'pod1',
      interactionType: FeedbackType.SAVE,
      timestamp: new Date().toISOString()
    };

    it('should record valid interaction', async () => {
      await expect(
        FeedbackService.recordInteraction(mockInteraction)
      ).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('user_interactions');
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});

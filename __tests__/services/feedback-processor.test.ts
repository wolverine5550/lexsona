import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FeedbackProcessor } from '@/services/feedback-processor';
import { FeedbackService } from '@/services/feedback-service';
import type { FeedbackDetails } from '@/types/feedback';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        limit: mockLimit
      })
    }),
    update: mockUpdate.mockReturnValue({
      eq: mockEq
    }),
    upsert: mockUpsert
  }))
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

// Mock FeedbackService
vi.mock('@/services/feedback-service', () => ({
  FeedbackService: {
    updateUserPreferences: vi.fn()
  }
}));

describe('FeedbackProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feedback Processing', () => {
    const mockFeedback: FeedbackDetails = {
      id: '123',
      userId: 'user1',
      podcastId: 'pod1',
      feedbackType: 'like',
      timestamp: new Date().toISOString(),
      isProcessed: false
    };

    it('should process unprocessed feedback', async () => {
      // Mock feedback queue
      mockLimit.mockResolvedValueOnce({
        data: [mockFeedback],
        error: null
      });

      // Mock preference update
      vi.mocked(FeedbackService.updateUserPreferences).mockResolvedValueOnce({
        userId: 'user1',
        topicWeights: { technology: 0.8 },
        stylePreferences: {
          interviewWeight: 0.3,
          narrativeWeight: 0.2,
          educationalWeight: 0.3,
          debateWeight: 0.2
        },
        lastAdjusted: new Date().toISOString()
      });

      // Mock successful updates
      mockUpsert.mockResolvedValueOnce({ error: null });
      mockUpdate.mockReturnValue({
        eq: mockEq.mockResolvedValueOnce({ error: null })
      });

      await FeedbackProcessor.processFeedbackQueue();

      expect(mockLimit).toHaveBeenCalled();
      expect(FeedbackService.updateUserPreferences).toHaveBeenCalledWith(
        'user1'
      );
      expect(mockUpsert).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle processing errors gracefully', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [mockFeedback],
        error: null
      });

      vi.mocked(FeedbackService.updateUserPreferences).mockRejectedValueOnce(
        new Error('Update failed')
      );

      await expect(
        FeedbackProcessor.processFeedbackQueue()
      ).resolves.not.toThrow();
    });
  });
});

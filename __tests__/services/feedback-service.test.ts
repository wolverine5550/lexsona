import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FeedbackService } from '@/services/feedback-service';
import type { FeedbackDetails, UserInteraction } from '@/types/feedback';

// Mock Supabase client
const mockUpsert = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    upsert: mockUpsert,
    insert: mockInsert,
    select: mockSelect.mockReturnValue({
      eq: mockEq
    })
  }))
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feedback Storage', () => {
    const mockFeedback: FeedbackDetails = {
      id: '123',
      userId: 'user1',
      podcastId: 'pod1',
      feedbackType: 'like',
      rating: 5,
      timestamp: new Date().toISOString(),
      isProcessed: false
    };

    it('should store valid feedback', async () => {
      mockUpsert.mockResolvedValueOnce({ error: null });
      mockSelect.mockReturnValue({
        eq: mockEq.mockResolvedValueOnce({ data: [], error: null })
      });

      await expect(
        FeedbackService.storeFeedback(mockFeedback)
      ).resolves.not.toThrow();

      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should reject invalid feedback', async () => {
      const invalidFeedback = { ...mockFeedback, userId: '' };

      await expect(
        FeedbackService.storeFeedback(invalidFeedback)
      ).rejects.toThrow('Invalid feedback data');
    });
  });

  describe('Interaction Recording', () => {
    const mockInteraction: UserInteraction = {
      id: '123',
      userId: 'user1',
      podcastId: 'pod1',
      interactionType: 'listen',
      timestamp: new Date().toISOString()
    };

    it('should record valid interaction', async () => {
      mockInsert.mockResolvedValueOnce({ error: null });

      await expect(
        FeedbackService.recordInteraction(mockInteraction)
      ).resolves.not.toThrow();

      expect(mockInsert).toHaveBeenCalled();
    });

    it('should reject invalid interaction', async () => {
      const invalidInteraction = { ...mockInteraction, userId: '' };

      await expect(
        FeedbackService.recordInteraction(invalidInteraction)
      ).rejects.toThrow('Invalid interaction data');
    });
  });

  describe('Preference Updates', () => {
    it('should update user preferences based on feedback', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq.mockResolvedValueOnce({
          data: [
            {
              feedbackType: 'like',
              categories: ['business', 'technology']
            }
          ],
          error: null
        })
      });

      const preferences = await FeedbackService.updateUserPreferences('user1');

      expect(preferences).toHaveProperty('topicWeights');
      expect(preferences).toHaveProperty('stylePreferences');
      expect(preferences.userId).toBe('user1');
    });
  });
});

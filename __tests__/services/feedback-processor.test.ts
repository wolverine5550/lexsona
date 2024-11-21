import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Mock FeedbackService first
vi.mock('@/services/feedback-service', () => ({
  FeedbackService: {
    updateUserPreferences: vi.fn().mockResolvedValue({
      userId: 'test-user',
      topicWeights: { technology: 1 },
      stylePreferences: { interviewWeight: 1 },
      lastAdjusted: new Date().toISOString()
    })
  }
}));

// Then mock Supabase client
vi.mock('@/utils/supabase/client', () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockLimit = vi.fn();
  const mockFrom = vi.fn();

  // Set up the mock chain
  mockLimit.mockResolvedValue({
    data: [
      {
        id: 'test-feedback-1',
        userId: 'test-user',
        podcastId: 'test-podcast-1',
        feedbackType: 'RELEVANCE',
        rating: 4,
        comment: 'Good match',
        isProcessed: false,
        timestamp: new Date().toISOString(),
        categories: ['technology'],
        metadata: {
          podcastStyle: 'interview'
        }
      }
    ],
    error: null
  });

  mockEq.mockReturnValue({ limit: mockLimit });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect });

  return {
    createClient: vi.fn(() => ({
      from: mockFrom
    }))
  };
});

// Import services after mocks
import { FeedbackProcessor } from '@/services/feedback-processor';
import { FeedbackService } from '@/services/feedback-service';

describe('FeedbackProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feedback Processing', () => {
    it('should process feedback data correctly', async () => {
      // Process feedback
      await FeedbackProcessor.processFeedbackQueue();

      // Get the mock client
      const mockClient = vi.mocked(createClient)();

      // Verify the feedback processing flow
      expect(mockClient.from).toHaveBeenCalledWith('feedback');
      expect(mockClient.from('feedback').select).toHaveBeenCalled();
      expect(mockClient.from('feedback').select().eq).toHaveBeenCalledWith(
        'isProcessed',
        false
      );
      expect(FeedbackService.updateUserPreferences).toHaveBeenCalled();
    });
  });
});

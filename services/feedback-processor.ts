import { createClient } from '@/utils/supabase/client';
import { FeedbackService } from './feedback-service';
import type { FeedbackDetails, PreferenceAdjustment } from '@/types/feedback';

/**
 * Service to process feedback and update recommendation algorithms
 */
export class FeedbackProcessor {
  private static supabase = createClient();
  private static readonly BATCH_SIZE = 100;
  private static readonly PROCESS_INTERVAL = 1000 * 60 * 15; // 15 minutes

  /**
   * Process unprocessed feedback entries in batches
   */
  public static async processFeedbackQueue(): Promise<void> {
    const { data: unprocessedFeedback, error } = await this.supabase
      .from('feedback')
      .select('*')
      .eq('isProcessed', false)
      .limit(this.BATCH_SIZE);

    if (error) {
      console.error('Failed to fetch unprocessed feedback:', error);
      return;
    }

    for (const feedback of unprocessedFeedback || []) {
      await this.processSingleFeedback(feedback);
    }
  }

  /**
   * Process a single feedback entry and update user preferences
   */
  private static async processSingleFeedback(
    feedback: FeedbackDetails
  ): Promise<void> {
    try {
      // Update user preferences
      const preferences = await FeedbackService.updateUserPreferences(
        feedback.userId
      );

      // Update recommendation weights
      await this.updateRecommendationWeights(feedback.userId, preferences);

      // Mark feedback as processed
      await this.supabase
        .from('feedback')
        .update({ isProcessed: true })
        .eq('id', feedback.id);
    } catch (error) {
      console.error('Failed to process feedback:', error);
    }
  }

  /**
   * Update recommendation weights based on user preferences
   */
  private static async updateRecommendationWeights(
    userId: string,
    preferences: PreferenceAdjustment
  ): Promise<void> {
    const { error } = await this.supabase.from('podcast_preferences').upsert({
      author_id: userId,
      style_preferences: preferences.stylePreferences,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Failed to update recommendation weights:', error);
    }
  }

  /**
   * Start the feedback processing loop
   */
  public static startProcessingLoop(): void {
    setInterval(() => {
      this.processFeedbackQueue().catch(console.error);
    }, this.PROCESS_INTERVAL);
  }

  /**
   * Stop the feedback processing loop
   */
  public static stopProcessingLoop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  private static processingInterval: NodeJS.Timeout | null = null;
}

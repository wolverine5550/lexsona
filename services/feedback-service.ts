import { createClient } from '@/utils/supabase/client';
import {
  type FeedbackDetails,
  type UserInteraction,
  type FeedbackMetrics,
  type PreferenceAdjustment,
  validateFeedback,
  validateInteraction,
  FeedbackError
} from '@/types/feedback';

/**
 * Service to handle all feedback-related operations
 * Manages user interactions, feedback collection, and preference adjustments
 */
export class FeedbackService {
  private static supabase = createClient();
  private static readonly FEEDBACK_TABLE = 'feedback';
  private static readonly INTERACTIONS_TABLE = 'user_interactions';
  private static readonly METRICS_TABLE = 'feedback_metrics';

  /**
   * Store user feedback for a podcast
   * @throws FeedbackError if storage fails
   */
  public static async storeFeedback(feedback: FeedbackDetails): Promise<void> {
    if (!validateFeedback(feedback)) {
      throw new FeedbackError(
        'Invalid feedback data',
        'VALIDATION_ERROR',
        feedback
      );
    }

    const { error } = await this.supabase.from(this.FEEDBACK_TABLE).upsert({
      ...feedback,
      timestamp: new Date().toISOString(),
      isProcessed: false
    });

    if (error) {
      throw new FeedbackError(
        'Failed to store feedback',
        'STORAGE_ERROR',
        error
      );
    }

    // Trigger metrics update
    await this.updateMetrics(feedback.podcastId);
  }

  /**
   * Record a user interaction with a podcast
   * @throws FeedbackError if storage fails
   */
  public static async recordInteraction(
    interaction: UserInteraction
  ): Promise<void> {
    if (!validateInteraction(interaction)) {
      throw new FeedbackError(
        'Invalid interaction data',
        'VALIDATION_ERROR',
        interaction
      );
    }

    const { error } = await this.supabase
      .from(this.INTERACTIONS_TABLE)
      .insert(interaction);

    if (error) {
      throw new FeedbackError(
        'Failed to record interaction',
        'STORAGE_ERROR',
        error
      );
    }
  }

  /**
   * Update aggregated metrics for a podcast
   * @private
   */
  private static async updateMetrics(podcastId: string): Promise<void> {
    // Fetch all feedback for the podcast
    const { data: feedbackData, error: feedbackError } = await this.supabase
      .from(this.FEEDBACK_TABLE)
      .select('*')
      .eq('podcastId', podcastId);

    if (feedbackError) {
      throw new FeedbackError(
        'Failed to fetch feedback data',
        'PROCESSING_ERROR',
        feedbackError
      );
    }

    // Calculate metrics
    const metrics: FeedbackMetrics = {
      podcastId,
      totalInteractions: feedbackData.length,
      likeCount: feedbackData.filter((f) => f.feedbackType === 'like').length,
      dislikeCount: feedbackData.filter((f) => f.feedbackType === 'dislike')
        .length,
      saveCount: feedbackData.filter((f) => f.feedbackType === 'save').length,
      listenCount: feedbackData.filter((f) => f.feedbackType === 'listen')
        .length,
      completionCount: feedbackData.filter((f) => f.feedbackType === 'complete')
        .length,
      averageRating:
        feedbackData.reduce((acc, f) => acc + (f.rating || 0), 0) /
        feedbackData.filter((f) => f.rating).length,
      lastUpdated: new Date().toISOString()
    };

    // Store updated metrics
    const { error: metricsError } = await this.supabase
      .from(this.METRICS_TABLE)
      .upsert(metrics);

    if (metricsError) {
      throw new FeedbackError(
        'Failed to update metrics',
        'STORAGE_ERROR',
        metricsError
      );
    }
  }

  /**
   * Update user preferences based on their feedback
   */
  public static async updateUserPreferences(
    userId: string
  ): Promise<PreferenceAdjustment> {
    // Fetch user's feedback history
    const { data: userFeedback, error } = await this.supabase
      .from(this.FEEDBACK_TABLE)
      .select('*')
      .eq('userId', userId);

    if (error) {
      throw new FeedbackError(
        'Failed to fetch user feedback',
        'PROCESSING_ERROR',
        error
      );
    }

    // Calculate preference adjustments based on feedback patterns
    const preferences: PreferenceAdjustment = {
      userId,
      topicWeights: this.calculateTopicWeights(userFeedback),
      stylePreferences: this.calculateStylePreferences(userFeedback),
      lastAdjusted: new Date().toISOString()
    };

    return preferences;
  }

  /**
   * Calculate topic weights based on user feedback
   * Analyzes user's feedback history to determine topic preferences
   * @private
   */
  private static calculateTopicWeights(
    feedback: FeedbackDetails[]
  ): Record<string, number> {
    const weights: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    let totalPositiveInteractions = 0;

    // Count positive interactions for each topic
    feedback.forEach((entry) => {
      if (entry.feedbackType === 'like' || entry.feedbackType === 'save') {
        entry.categories?.forEach((category) => {
          topicCounts[category] = (topicCounts[category] || 0) + 1;
          totalPositiveInteractions++;
        });
      }
    });

    // Calculate normalized weights
    Object.entries(topicCounts).forEach(([topic, count]) => {
      weights[topic] = count / totalPositiveInteractions;
    });

    // Apply decay factor to older feedback
    const now = new Date();
    feedback.forEach((entry) => {
      const age = now.getTime() - new Date(entry.timestamp).getTime();
      const decayFactor = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30-day half-life

      entry.categories?.forEach((category) => {
        if (weights[category]) {
          weights[category] *= decayFactor;
        }
      });
    });

    return weights;
  }

  /**
   * Calculate style preferences based on user feedback
   * Analyzes interaction patterns to determine preferred podcast formats
   * @private
   */
  private static calculateStylePreferences(feedback: FeedbackDetails[]): {
    interviewWeight: number;
    narrativeWeight: number;
    educationalWeight: number;
    debateWeight: number;
  } {
    const styles = {
      interviewWeight: 0,
      narrativeWeight: 0,
      educationalWeight: 0,
      debateWeight: 0
    };

    let totalWeight = 0;

    feedback.forEach((entry) => {
      if (entry.feedbackType === 'like' || entry.feedbackType === 'complete') {
        // Calculate age-based weight (newer feedback has more influence)
        const age = Date.now() - new Date(entry.timestamp).getTime();
        const weight = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30-day half-life

        // Update style weights based on metadata
        if (entry.metadata?.podcastStyle) {
          switch (entry.metadata.podcastStyle) {
            case 'interview':
              styles.interviewWeight += weight;
              break;
            case 'narrative':
              styles.narrativeWeight += weight;
              break;
            case 'educational':
              styles.educationalWeight += weight;
              break;
            case 'debate':
              styles.debateWeight += weight;
              break;
          }
          totalWeight += weight;
        }
      }
    });

    // Normalize weights
    if (totalWeight > 0) {
      Object.keys(styles).forEach((key) => {
        styles[key as keyof typeof styles] /= totalWeight;
      });
    } else {
      // Default to equal weights if no feedback
      return {
        interviewWeight: 0.25,
        narrativeWeight: 0.25,
        educationalWeight: 0.25,
        debateWeight: 0.25
      };
    }

    return styles;
  }
}

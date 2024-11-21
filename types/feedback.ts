/**
 * Types for user feedback and interaction tracking
 */

/**
 * Types of user feedback
 */
export enum FeedbackType {
  RELEVANCE = 'RELEVANCE',
  LIKE = 'like',
  SAVE = 'save',
  COMPLETE = 'complete'
}

/**
 * Podcast style types
 */
export type PodcastStyle = 'interview' | 'narrative' | 'educational' | 'debate';

/**
 * User interaction with a podcast
 */
export interface UserInteraction {
  id: string;
  userId: string;
  podcastId: string;
  interactionType: FeedbackType;
  timestamp: string;
  metadata?: {
    listenDuration?: number; // Duration listened in seconds
    completionPercent?: number; // Percentage of episode completed
    deviceType?: string; // Device used for listening
    source?: string; // Where the interaction originated
  };
}

/**
 * Feedback details from user
 */
export interface FeedbackDetails {
  id: string;
  userId: string;
  podcastId: string;
  feedbackType: FeedbackType;
  rating: number;
  comment?: string; // Optional user comment
  categories?: string[]; // Categories user associates with podcast
  timestamp: string;
  isProcessed: boolean; // Whether feedback has been processed
  metadata?: {
    podcastStyle?: PodcastStyle;
    listenDuration?: number;
    completionPercent?: number;
    deviceType?: string;
    source?: string;
  };
}

/**
 * Aggregated feedback metrics
 */
export interface FeedbackMetrics {
  podcastId: string;
  totalInteractions: number;
  likeCount: number;
  dislikeCount: number;
  saveCount: number;
  listenCount: number;
  completionCount: number;
  averageRating: number;
  lastUpdated: string;
}

/**
 * User preference adjustments based on feedback
 */
export interface PreferenceAdjustment {
  userId: string;
  topicWeights: Record<string, number>; // Adjusted topic weights
  stylePreferences: {
    interviewWeight: number;
    narrativeWeight: number;
    educationalWeight: number;
    debateWeight: number;
  };
  lastAdjusted: string;
}

/**
 * Error types for feedback operations
 */
export class FeedbackError extends Error {
  constructor(
    message: string,
    public code: 'STORAGE_ERROR' | 'PROCESSING_ERROR' | 'VALIDATION_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'FeedbackError';
  }
}

/**
 * Validation functions
 */
export const validateFeedback = (feedback: FeedbackDetails): boolean => {
  if (!feedback.userId || !feedback.podcastId) {
    return false;
  }
  if (feedback.rating && (feedback.rating < 1 || feedback.rating > 5)) {
    return false;
  }
  return true;
};

export const validateInteraction = (interaction: UserInteraction): boolean => {
  if (!interaction.userId || !interaction.podcastId) {
    return false;
  }
  if (interaction.metadata?.completionPercent) {
    const percent = interaction.metadata.completionPercent;
    if (percent < 0 || percent > 100) {
      return false;
    }
  }
  return true;
};

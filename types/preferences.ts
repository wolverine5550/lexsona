/**
 * Podcast topic categories that users can select
 */
export type PodcastTopic =
  | 'technology'
  | 'business'
  | 'science'
  | 'health'
  | 'education'
  | 'entertainment'
  | 'news'
  | 'sports'
  | 'culture'
  | 'politics';

/**
 * Podcast length preferences
 */
export type PodcastLength = 'short' | 'medium' | 'long';

/**
 * Podcast style preferences
 */
export interface StylePreferences {
  isInterviewPreferred: boolean;
  isStorytellingPreferred: boolean;
  isEducationalPreferred: boolean;
  isDebatePreferred: boolean;
}

/**
 * Complete user preferences structure
 */
export interface UserPreferences {
  id?: string;
  userId: string;
  topics: PodcastTopic[];
  preferredLength: PodcastLength;
  stylePreferences: StylePreferences;
  updatedAt: string;
  createdAt: string;
}

/**
 * Form validation schema
 */
export interface PreferencesFormErrors {
  topics?: string;
  preferredLength?: string;
  stylePreferences?: string;
  submit?: string;
}

import type { AuthorOnboardingData, PodcastPreferences } from '@/types/author';

/**
 * Profile update request body type
 */
export interface ProfileUpdateRequest {
  profile?: Partial<AuthorOnboardingData>;
  preferences?: Partial<PodcastPreferences>;
}

/**
 * Profile update response type
 */
export interface ProfileUpdateResponse {
  message: string;
  data: {
    profile: AuthorOnboardingData | null;
    preferences: PodcastPreferences | null;
    books: any[] | null; // TODO: Replace with proper book type
  };
}

/**
 * API error response type
 */
export interface ApiError {
  error: string;
  details?: string;
}

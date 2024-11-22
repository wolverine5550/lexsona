/**
 * Types for Listen Notes API responses and podcast data
 */

// Base podcast type from Listen Notes API
export interface Podcast {
  id: string;
  title: string;
  publisher: string;
  image: string;
  description: string;
  website: string;
  language: string;
  categories: Array<{
    id: number;
    name: string;
  }>;
  total_episodes: number;
  average_duration: number;
  publish_frequency: string;
  rating: number;
  rss_feed: string;
  image_url: string;
  status: string;
  listen_score: number;
  explicit_content: boolean;
  latest_episode_id: string;
  latest_pub_date_ms: number;
}

// Search response from Listen Notes API
export interface PodcastSearchResponse {
  count: number;
  total: number;
  results: Podcast[];
  next_offset: number;
}

// Enhanced podcast match type for our application
export interface PodcastMatch {
  podcast: Podcast;
  score: number; // Matching score (0-1)
  matchReasons: string[]; // Array of reasons why this podcast matches
  bookId: string; // Reference to the book this match is for
  status: PodcastMatchStatus; // Current status of the match
  lastContactedAt?: Date | null;
  notes?: string; // Optional notes about the match/outreach
}

// Status of a podcast match
export type PodcastMatchStatus =
  | 'pending' // Initial state
  | 'contacted' // Outreach email sent
  | 'responded' // Host has responded
  | 'scheduled' // Interview scheduled
  | 'completed' // Interview completed
  | 'rejected' // Host declined or no response
  | 'archived'; // Match archived by author

// Search parameters for podcast discovery
export interface PodcastSearchParams {
  query: string;
  offset?: number;
  sort_by_date?: 0 | 1;
  type?: 'episode' | 'podcast';
  language?: string;
  len_min?: number;
  len_max?: number;
  genre_ids?: string;
  published_before?: number;
  published_after?: number;
  only_in?: string;
  safe_mode?: 0 | 1;
}

export interface BatchProcessResult {
  userId: string;
  matches: PodcastMatch[];
}

/**
 * Defines the level of audience expertise a podcast targets
 */
export type AudienceLevel = 'beginner' | 'intermediate' | 'expert' | 'mixed';

/**
 * Defines the typical style of podcast host interaction
 */
export type HostStyle =
  | 'conversational'
  | 'interview'
  | 'educational'
  | 'debate'
  | 'storytelling';

/**
 * Represents the depth of topic coverage in a podcast
 */
export type TopicDepth = 'surface' | 'moderate' | 'deep' | 'comprehensive';

/**
 * Core podcast information from Listen Notes API
 */
export interface PodcastBase {
  id: string;
  title: string;
  description: string;
  publisher: string;
  language: string;
  categories: string[];
  totalEpisodes: number;
  averageEpisodeLength: number;
  website?: string;
  listenNotesUrl: string;
}

/**
 * Enhanced podcast analysis including AI-derived insights
 */
export interface PodcastAnalysis {
  podcastId: string;
  hostStyle: HostStyle;
  audienceLevel: AudienceLevel;
  topicDepth: TopicDepth;
  guestRequirements: {
    minimumExpertise: AudienceLevel;
    preferredTopics: string[];
    communicationPreference: string[];
  };
  topicalFocus: string[];
  confidence: number;
  lastAnalyzed: Date;
}

/**
 * Combined podcast data with both base info and analysis
 */
export interface EnhancedPodcast extends PodcastBase {
  analysis?: PodcastAnalysis;
}

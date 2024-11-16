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

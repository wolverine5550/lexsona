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
  id: string;
  podcastId: string;
  authorId: string;
  bookId: string;
  initialContactDate: string;
  lastFollowUpDate?: string;
  outcome: MatchOutcome;
  responseDate?: string;
  notes?: string;
  emailThread?: string;
  followUpCount: number;
  matchConfidence: number;
  matchReasons: string[];
  score: number;
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
  language?: string;
  sort_by_date?: number;
  offset?: number;
  len_min?: number;
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
  categories: string[];
  averageEpisodeLength: number;
  totalEpisodes: number;
  language: string;
  type: string;
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

/**
 * Represents the status of a podcast episode in relation to an author
 * - SAVED: Author has saved this episode for later
 * - MATCHED: Author has been matched/invited to this podcast
 * - SCHEDULED: Interview has been scheduled
 * - RECORDED: Interview has been recorded
 * - PUBLISHED: Episode has been published
 */
export type PodcastStatus =
  | 'SAVED'
  | 'MATCHED'
  | 'SCHEDULED'
  | 'RECORDED'
  | 'PUBLISHED';

/**
 * Represents a podcast show
 */
export interface PodcastShow {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  hostName: string;
  category: string[];
  averageListeners: number;
  websiteUrl: string;
  rssUrl?: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

/**
 * Represents a specific episode of a podcast
 */
export interface PodcastEpisode {
  id: string;
  showId: string;
  title: string;
  description: string;
  publishDate: string;
  duration: string;
  listenerCount: number;
  audioUrl: string;
  transcriptUrl?: string;
}

/**
 * Represents an author's interaction with a podcast episode
 */
export interface PodcastInteraction {
  id: string;
  authorId: string;
  episodeId: string;
  showId: string;
  status: PodcastStatus;
  savedDate: string;
  notes?: string;
  matchDate?: string;
  scheduledDate?: string;
  recordingDate?: string;
  publishDate?: string;
  preparationNotes?: string;
  followUpNotes?: string;
}

/**
 * Represents the outcome of a podcast match attempt
 */
export type MatchOutcome =
  | 'PENDING' // Initial outreach sent, waiting for response
  | 'ACCEPTED' // Host accepted the interview request
  | 'DECLINED' // Host declined the interview request
  | 'NO_RESPONSE' // No response received after follow-ups
  | 'CANCELLED' // Interview was scheduled but cancelled
  | 'COMPLETED'; // Interview was successfully completed

/**
 * Extended match info with podcast details
 */
export interface PodcastMatchWithDetails extends PodcastMatch {
  podcast: {
    name: string;
    hostName: string;
    coverImage: string;
    category: string[];
    averageListeners: number;
  };
}

/**
 * Type of contact made with a podcast host
 */
export type ContactType =
  | 'EMAIL' // Initial or follow-up email
  | 'CALL' // Phone call
  | 'SOCIAL' // Social media interaction
  | 'MEETING' // Video/in-person meeting
  | 'OTHER'; // Other form of contact

/**
 * Status of a contact attempt
 */
export type ContactStatus =
  | 'SENT' // Outreach was sent
  | 'RECEIVED' // Got a response
  | 'NO_REPLY' // No response after follow-up period
  | 'SCHEDULED' // Meeting/call scheduled
  | 'COMPLETED'; // Interaction completed

/**
 * Represents a single contact interaction with a podcast host
 */
export interface ContactHistory {
  id: string;
  podcastId: string;
  authorId: string;
  matchId: string;
  type: ContactType;
  status: ContactStatus;
  date: string;
  subject?: string;
  content: string;
  response?: string;
  responseDate?: string;
  nextFollowUpDate?: string;
  notes?: string;
  attachments?: string[];
  tags?: string[];
}

/**
 * Extended contact history with podcast details
 */
export interface ContactHistoryWithDetails extends ContactHistory {
  podcast: {
    name: string;
    hostName: string;
    coverImage: string;
    email?: string;
  };
}

/**
 * Types of notes that can be added to a podcast interaction
 */
export type NoteType =
  | 'PREPARATION' // Pre-interview preparation notes
  | 'TALKING_POINT' // Key points to discuss
  | 'FOLLOW_UP' // Post-interview follow-up items
  | 'FEEDBACK' // Feedback about the interaction
  | 'GENERAL'; // General notes

/**
 * Priority level for notes
 */
export type NotePriority = 'HIGH' | 'MEDIUM' | 'LOW';

/**
 * Represents a single note or annotation
 */
export interface PodcastNote {
  id: string;
  podcastId: string;
  authorId: string;
  matchId?: string;
  contactId?: string;
  type: NoteType;
  priority: NotePriority;
  content: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  attachments?: string[];
  tags?: string[];
  relatedNotes?: string[]; // IDs of related notes
}

/**
 * Extended note with related podcast details
 */
export interface PodcastNoteWithDetails extends PodcastNote {
  podcast: {
    name: string;
    hostName: string;
    coverImage: string;
  };
}

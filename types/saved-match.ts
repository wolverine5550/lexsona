/**
 * Types for the podcast match tracking system
 */

/**
 * Represents the current status of a podcast match
 * @viewed - Author has viewed the match details
 * @contacted - Initial outreach has been made
 * @pending - Waiting for podcast host's response
 * @scheduled - Interview has been confirmed and scheduled
 * @completed - Interview has been conducted
 * @rejected - Match was rejected or no response received
 */
export type MatchStatus =
  | 'viewed'
  | 'contacted'
  | 'pending'
  | 'scheduled'
  | 'completed'
  | 'rejected';

/**
 * Represents why a match was rejected
 * Used for improving future matches
 */
export type RejectionReason =
  | 'not_relevant'
  | 'audience_mismatch'
  | 'no_response'
  | 'declined'
  | 'scheduling_conflict'
  | 'other';

/**
 * Core interface for tracking a saved podcast match
 */
export interface SavedMatch {
  // Unique identifiers
  id: string;
  authorId: string;
  podcastId: string;

  // Match information from the original matching process
  matchScore: number; // 0-1 score from the matching algorithm
  matchReasons: string[]; // Why this podcast was matched

  // Current status
  status: MatchStatus;
  rejectionReason?: RejectionReason;

  // Author's engagement
  isBookmarked: boolean;
  notes?: string;

  // Tracking dates
  createdAt: Date; // When the match was saved
  updatedAt: Date; // Last status update
  lastViewedAt?: Date; // Last time author viewed details
  contactedAt?: Date; // When first outreach was made
}

/**
 * Parameters for querying saved matches
 */
export interface SavedMatchQuery {
  authorId: string;
  status?: MatchStatus;
  isBookmarked?: boolean;
  minMatchScore?: number;
  limit?: number;
  offset?: number;
}

/**
 * Types for managing detailed notes and feedback on podcast matches
 */

/**
 * Categories for organizing notes
 * @preparation - Notes for interview preparation
 * @outreach - Notes about outreach strategy
 * @feedback - Feedback about the match quality
 * @followUp - Notes for follow-up actions
 * @general - General notes
 */
export type NoteCategory =
  | 'preparation'
  | 'outreach'
  | 'feedback'
  | 'followUp'
  | 'general';

/**
 * Feedback about match quality to improve future matches
 */
export interface MatchFeedback {
  isRelevant: boolean;
  audienceMatch: number; // 1-5 rating
  topicMatch: number; // 1-5 rating
  comments?: string;
}

/**
 * Structure for a single note entry
 */
export interface PodcastNote {
  id: string;
  matchId: string;
  authorId: string;
  category: NoteCategory;
  content: string;
  feedback?: MatchFeedback;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

/**
 * Parameters for querying notes
 */
export interface NotesQuery {
  matchId: string;
  authorId: string;
  category?: NoteCategory;
  isPinned?: boolean;
}

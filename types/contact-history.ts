/**
 * Types for tracking contact history with podcasts
 */

/**
 * Type of contact attempt made
 * @email - Direct email outreach
 * @social - Contact via social media
 * @form - Through podcast's submission form
 * @referral - Through a mutual connection
 * @other - Other contact methods
 */
export type ContactMethod = 'email' | 'social' | 'form' | 'referral' | 'other';

/**
 * Status of the contact attempt
 * @sent - Outreach was sent
 * @received - Got a response
 * @noResponse - No response after follow-up period
 * @scheduled - Successfully scheduled
 * @declined - Explicitly declined
 */
export type ContactStatus =
  | 'sent'
  | 'received'
  | 'noResponse'
  | 'scheduled'
  | 'declined';

/**
 * Platform used for social media outreach
 */
export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'other';

/**
 * Details specific to social media contact attempts
 */
export interface SocialContactDetails {
  platform: SocialPlatform;
  profileUrl?: string;
  messageUrl?: string;
}

/**
 * Details for email-based contact
 */
export interface EmailContactDetails {
  emailAddress: string;
  subject?: string;
  templateUsed?: string;
}

/**
 * Core interface for a contact attempt
 */
export interface ContactAttempt {
  id: string;
  matchId: string;
  authorId: string;

  // Contact details
  method: ContactMethod;
  status: ContactStatus;
  content: string;

  // Method-specific details
  emailDetails?: EmailContactDetails;
  socialDetails?: SocialContactDetails;

  // Follow-up tracking
  requiresFollowUp: boolean;
  followUpDate?: Date;
  followUpNote?: string;

  // Response tracking
  responseReceived?: string;
  responseDate?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query parameters for fetching contact history
 */
export interface ContactHistoryQuery {
  matchId: string;
  authorId: string;
  method?: ContactMethod;
  status?: ContactStatus;
  requiresFollowUp?: boolean;
}

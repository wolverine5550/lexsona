import { createClient } from '@/utils/supabase/client';
import type {
  ContactAttempt,
  ContactMethod,
  ContactStatus,
  EmailContactDetails,
  SocialContactDetails,
  ContactHistoryQuery
} from '@/types/contact-history';

/**
 * Service for managing contact history with podcasts
 * Handles tracking outreach attempts, follow-ups, and responses
 */
export class ContactHistoryService {
  /**
   * Record a new contact attempt with a podcast
   * @param matchId - ID of the saved podcast match
   * @param authorId - ID of the author making contact
   * @param method - Method of contact (email, social, etc.)
   * @param content - Content of the outreach message
   * @param emailDetails - Required details if method is email
   * @param socialDetails - Required details if method is social
   */
  static async recordContact(
    matchId: string,
    authorId: string,
    method: ContactMethod,
    content: string,
    emailDetails?: EmailContactDetails,
    socialDetails?: SocialContactDetails
  ): Promise<ContactAttempt> {
    const supabase = createClient();

    // Validate method-specific details
    if (method === 'email' && !emailDetails?.emailAddress) {
      throw new Error('Email address is required for email contact method');
    }
    if (method === 'social' && !socialDetails?.platform) {
      throw new Error('Platform is required for social contact method');
    }

    const newContact = {
      match_id: matchId,
      author_id: authorId,
      method,
      status: 'sent' as ContactStatus,
      content,
      email_details: emailDetails,
      social_details: socialDetails,
      requires_follow_up: true,
      follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    };

    const { data, error } = await supabase
      .from('contact_history')
      .insert(newContact)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record contact: ${error.message}`);
    }

    return data as ContactAttempt;
  }

  /**
   * Update the status of a contact attempt
   * @param contactId - ID of the contact attempt
   * @param status - New status
   * @param responseReceived - Optional response content
   */
  static async updateStatus(
    contactId: string,
    status: ContactStatus,
    responseReceived?: string
  ): Promise<ContactAttempt> {
    const supabase = createClient();

    const updates: Partial<ContactAttempt> = {
      status,
      ...(responseReceived && {
        response_received: responseReceived,
        response_date: new Date().toISOString()
      }),
      // Automatically handle follow-up based on status
      requires_follow_up: status === 'sent' || status === 'received',
      ...(status === 'declined' && { requires_follow_up: false })
    };

    const { data, error } = await supabase
      .from('contact_history')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact status: ${error.message}`);
    }

    return data as ContactAttempt;
  }

  /**
   * Update follow-up details for a contact attempt
   * @param contactId - ID of the contact attempt
   * @param requiresFollowUp - Whether follow-up is needed
   * @param followUpDate - When to follow up
   * @param followUpNote - Notes for follow-up
   */
  static async updateFollowUp(
    contactId: string,
    requiresFollowUp: boolean,
    followUpDate?: Date,
    followUpNote?: string
  ): Promise<ContactAttempt> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('contact_history')
      .update({
        requires_follow_up: requiresFollowUp,
        follow_up_date: followUpDate?.toISOString(),
        follow_up_note: followUpNote
      })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update follow-up details: ${error.message}`);
    }

    return data as ContactAttempt;
  }

  /**
   * Get contact history for a match with optional filters
   * @param query - Query parameters for filtering contact history
   */
  static async getContactHistory(
    query: ContactHistoryQuery
  ): Promise<ContactAttempt[]> {
    const supabase = createClient();

    let historyQuery = supabase
      .from('contact_history')
      .select('*')
      .eq('match_id', query.matchId)
      .eq('author_id', query.authorId);

    // Apply optional filters
    if (query.method) {
      historyQuery = historyQuery.eq('method', query.method);
    }
    if (query.status) {
      historyQuery = historyQuery.eq('status', query.status);
    }
    if (query.requiresFollowUp !== undefined) {
      historyQuery = historyQuery.eq(
        'requires_follow_up',
        query.requiresFollowUp
      );
    }

    const { data, error } = await historyQuery.order('created_at', {
      ascending: false
    });

    if (error) {
      throw new Error(`Failed to fetch contact history: ${error.message}`);
    }

    return data as ContactAttempt[];
  }
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { InterviewService } from '@/types/services';
import type { ApiResponse } from '@/types/dashboard';

/**
 * Implementation of the Interview Service
 * Handles all podcast interview-related operations including:
 * - Fetching upcoming interviews
 * - Scheduling new interviews
 * - Updating interview details
 * - Managing interview statuses
 */
export class InterviewServiceImpl implements InterviewService {
  /**
   * Initialize service with Supabase client
   * @param supabase - Typed Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches upcoming interviews for an author
   * Includes podcast details and filters by date/status
   *
   * @param authorId - The ID of the author to fetch interviews for
   * @param status - Optional status filter
   * @returns Promise with interviews data or error
   */
  async getUpcomingInterviews(
    authorId: string,
    status?: Database['public']['Enums']['interview_status']
  ): Promise<ApiResponse<Database['public']['Tables']['interviews']['Row'][]>> {
    try {
      // Build base query with podcast details and future date filter
      const query = this.supabase
        .from('interviews')
        .select(
          `
          id,
          author_id,
          podcast_id,
          scheduled_date,
          scheduled_time,
          duration,
          status,
          notes,
          meeting_link,
          created_at,
          updated_at,
          podcast:podcasts (
            id,
            title,
            publisher,
            description,
            image,
            categories
          )
        `
        )
        .eq('author_id', authorId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      // Add status filter if provided
      if (status) {
        query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract just the interview data without the podcast details
      const interviews =
        data?.map(({ podcast, ...interview }) => interview) ?? [];

      return { data: interviews };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_INTERVIEWS_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch interviews'
        }
      };
    }
  }

  /**
   * Schedules a new interview
   * Creates interview record and associated activity
   *
   * @param data - The interview details including podcast and scheduling info
   * @returns Promise with created interview data or error
   */
  async scheduleInterview(
    data: Database['public']['Tables']['interviews']['Insert']
  ): Promise<ApiResponse<Database['public']['Tables']['interviews']['Row']>> {
    try {
      // Insert new interview record
      const { data: interview, error } = await this.supabase
        .from('interviews')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      // Create activity record for the new interview
      await this.supabase.from('activities').insert([
        {
          author_id: data.author_id,
          type: 'interview',
          title: 'Interview Scheduled',
          description: `New interview scheduled for ${data.scheduled_date}`,
          metadata: {
            interview_id: interview.id,
            podcast_id: data.podcast_id,
            scheduled_date: data.scheduled_date,
            scheduled_time: data.scheduled_time
          }
        }
      ]);

      return { data: interview };
    } catch (error) {
      return {
        error: {
          code: 'SCHEDULE_INTERVIEW_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to schedule interview'
        }
      };
    }
  }

  /**
   * Updates an existing interview's details
   * Handles status changes and reschedules
   *
   * @param interviewId - The ID of the interview to update
   * @param data - The fields to update
   * @returns Promise with success or error
   */
  async updateInterview(
    interviewId: string,
    data: Partial<Database['public']['Tables']['interviews']['Update']>
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('interviews')
        .update(data)
        .eq('id', interviewId);

      if (error) throw error;

      // Create activity for status changes
      if (data.status) {
        await this.supabase.from('activities').insert([
          {
            author_id: data.author_id!,
            type: 'interview',
            title: 'Interview Status Updated',
            description: `Interview status changed to ${data.status}`,
            metadata: {
              interview_id: interviewId,
              new_status: data.status
            }
          }
        ]);
      }

      return {};
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_INTERVIEW_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update interview'
        }
      };
    }
  }

  /**
   * Sets up real-time subscription for interview updates
   * Notifies when interviews are created, updated, or deleted
   * Useful for keeping the UI in sync with database changes
   *
   * @param authorId - The ID of the author to watch
   * @param onUpdate - Callback function for updates
   * @returns Cleanup function to unsubscribe
   */
  subscribeToInterviews(
    authorId: string,
    onUpdate: (
      interview: Database['public']['Tables']['interviews']['Row']
    ) => void
  ) {
    // Create a channel for this author's interviews
    const channel = this.supabase
      .channel(`interviews:${authorId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'interviews',
          filter: `author_id=eq.${authorId}`
        },
        (payload) => {
          // Cast the payload to our known type and call the callback
          onUpdate(
            payload.new as Database['public']['Tables']['interviews']['Row']
          );
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      channel.unsubscribe();
    };
  }
}

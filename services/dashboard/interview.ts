import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { InterviewService, ApiResponse } from '@/types/services';

type Interview = Database['public']['Tables']['interviews']['Row'];
type InterviewStatus = Database['public']['Enums']['interview_status'];

/**
 * Implementation of the Interview Service
 * Handles all podcast interview-related operations
 */
export class InterviewServiceImpl implements InterviewService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getUpcomingInterviews(
    authorId: string,
    status?: InterviewStatus
  ): Promise<ApiResponse<Interview[]>> {
    try {
      let query = this.supabase
        .from('interviews')
        .select('*')
        .eq('author_id', authorId)
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data ?? [],
        error: undefined
      };
    } catch (error) {
      return {
        data: [],
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  async scheduleInterview(
    data: Database['public']['Tables']['interviews']['Insert']
  ): Promise<ApiResponse<Interview>> {
    try {
      const { data: interview, error } = await this.supabase
        .from('interviews')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      if (!interview) throw new Error('No interview returned');

      return { data: interview };
    } catch (error) {
      return {
        data: null as any,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

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

      return { data: undefined };
    } catch (error) {
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  subscribeToInterviews(
    authorId: string,
    onUpdate: (interview: Interview) => void
  ): () => void {
    const channel = this.supabase
      .channel(`interviews:${authorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interviews',
          filter: `author_id=eq.${authorId}`
        },
        (payload) => {
          onUpdate(payload.new as Interview);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ActivityService } from '@/types/services';
import type { ApiResponse } from '@/types/dashboard';

/**
 * Implementation of the Activity Service
 * Handles all activity-related operations including:
 * - Fetching activity feed items
 * - Creating activity records
 * - Filtering and sorting activities
 * - Activity aggregation and grouping
 */
export class ActivityServiceImpl implements ActivityService {
  /**
   * Initialize service with Supabase client
   * @param supabase - Typed Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches recent activities for an author
   * Orders by creation date, newest first
   * Can be filtered by type and limited
   *
   * @param authorId - The ID of the author to fetch activities for
   * @param limit - Maximum number of activities to return (default: 20)
   * @returns Promise with activities data or error
   */
  async getRecentActivities(
    authorId: string,
    limit = 20
  ): Promise<ApiResponse<Database['public']['Tables']['activities']['Row'][]>> {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .select(
          `
          id,
          author_id,
          type,
          title,
          description,
          metadata,
          created_at
        `
        )
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data ?? [] };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_ACTIVITIES_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch activities'
        }
      };
    }
  }

  /**
   * Creates a new activity record
   * Used internally by other services to track actions
   *
   * @param data - The activity details to create
   * @returns Promise with created activity or error
   */
  async createActivity(
    data: Database['public']['Tables']['activities']['Insert']
  ): Promise<ApiResponse<Database['public']['Tables']['activities']['Row']>> {
    try {
      const { data: activity, error } = await this.supabase
        .from('activities')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      return { data: activity };
    } catch (error) {
      return {
        error: {
          code: 'CREATE_ACTIVITY_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to create activity'
        }
      };
    }
  }

  /**
   * Gets activities grouped by date
   * Useful for displaying activities in date-separated sections
   *
   * @param authorId - The ID of the author to fetch activities for
   * @param days - Number of days to look back (default: 7)
   * @returns Promise with grouped activities or error
   */
  async getGroupedActivities(
    authorId: string,
    days = 7
  ): Promise<
    ApiResponse<
      {
        date: string;
        activities: Database['public']['Tables']['activities']['Row'][];
      }[]
    >
  > {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .select('*')
        .eq('author_id', authorId)
        .gte(
          'created_at',
          new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group activities by date
      const grouped = (data ?? []).reduce<
        Record<string, Database['public']['Tables']['activities']['Row'][]>
      >((acc, activity) => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        acc[date] = acc[date] || [];
        acc[date].push(activity);
        return acc;
      }, {});

      // Convert to array format
      const result = Object.entries(grouped).map(([date, activities]) => ({
        date,
        activities
      }));

      return { data: result };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_GROUPED_ACTIVITIES_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch grouped activities'
        }
      };
    }
  }
}

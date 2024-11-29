import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ActivityService, ApiResponse } from '@/types/services';

type Activity = Database['public']['Tables']['activities']['Row'];
type GroupedActivities = {
  date: string;
  activities: Activity[];
}[];

/**
 * Implementation of the Activity Service
 * Handles all activity-related operations including:
 * - Fetching activity feed items
 * - Creating activity records
 * - Filtering and sorting activities
 * - Activity aggregation and grouping
 */
export class ActivityServiceImpl implements ActivityService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches recent activities for an author
   * Orders by creation date, newest first
   * Can be filtered by type and limited
   */
  async getRecentActivities(
    authorId: string,
    limit = 20
  ): Promise<ApiResponse<Activity[]>> {
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
        data: [],
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Creates a new activity record
   * Used internally by other services to track actions
   */
  async createActivity(
    data: Database['public']['Tables']['activities']['Insert']
  ): Promise<ApiResponse<Activity>> {
    try {
      const { data: activity, error } = await this.supabase
        .from('activities')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      if (!activity) throw new Error('No activity returned');

      return { data: activity };
    } catch (error) {
      return {
        data: {} as Activity, // Cast empty object to Activity to satisfy type
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Gets activities grouped by date
   * Useful for displaying activities in date-separated sections
   */
  async getGroupedActivities(
    authorId: string,
    days = 7
  ): Promise<ApiResponse<GroupedActivities>> {
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
      const grouped = (data ?? []).reduce<Record<string, Activity[]>>(
        (acc, activity) => {
          const date = new Date(activity.created_at)
            .toISOString()
            .split('T')[0];
          acc[date] = acc[date] || [];
          acc[date].push(activity);
          return acc;
        },
        {}
      );

      // Convert to array format
      const result = Object.entries(grouped).map(([date, activities]) => ({
        date,
        activities
      }));

      return { data: result };
    } catch (error) {
      return {
        data: [], // Return empty array for grouped activities
        error: {
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  DashboardService,
  MatchService,
  InterviewService,
  NotificationService,
  ApiResponse
} from '@/types/services';
import { MatchServiceImpl } from './match';
import { InterviewServiceImpl } from './interview';
import { NotificationServiceImpl } from './notification';

type Stats = {
  author_id: string;
  total_matches: number;
  pending_requests: number;
  upcoming_interviews: number;
  profile_views: number;
  updated_at: string;
};

/**
 * Base dashboard service implementation
 * Coordinates between different sub-services
 */
export class BaseDashboardService implements DashboardService {
  protected supabase: SupabaseClient<Database>;

  // Initialize sub-services
  public readonly matches: MatchService;
  public readonly interviews: InterviewService;
  public readonly notifications: NotificationService;

  constructor() {
    this.supabase = createClient();
    // Initialize all sub-services with the same Supabase client
    this.matches = new MatchServiceImpl(this.supabase);
    this.interviews = new InterviewServiceImpl(this.supabase);
    this.notifications = new NotificationServiceImpl(this.supabase);
  }

  /**
   * Fetches dashboard statistics for an author
   * @param authorId - The ID of the author
   */
  async getStats(authorId: string): Promise<ApiResponse<Stats>> {
    try {
      const { data, error } = await this.supabase
        .from('author_stats')
        .select('*')
        .eq('author_id', authorId)
        .single();

      if (error) throw error;

      return { data: data as Stats };
    } catch (error) {
      return {
        data: {
          author_id: authorId,
          total_matches: 0,
          pending_requests: 0,
          upcoming_interviews: 0,
          profile_views: 0,
          updated_at: new Date().toISOString()
        },
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to fetch stats'
        }
      };
    }
  }
}

// Export singleton instance
export const dashboardService = new BaseDashboardService();

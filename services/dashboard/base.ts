import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type {
  DashboardService,
  MatchService,
  InterviewService,
  NotificationService,
  ActivityService
} from '@/types/services';
import { MatchServiceImpl } from './match';
import { InterviewServiceImpl } from './interview';
import { NotificationServiceImpl } from './notification';
import { ActivityServiceImpl } from './activity';

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
  public readonly activities: ActivityService;

  constructor() {
    this.supabase = createClient();
    // Initialize all sub-services with the same Supabase client
    this.matches = new MatchServiceImpl(this.supabase);
    this.interviews = new InterviewServiceImpl(this.supabase);
    this.notifications = new NotificationServiceImpl(this.supabase);
    this.activities = new ActivityServiceImpl(this.supabase);
  }

  /**
   * Fetches dashboard statistics for an author
   * @param authorId - The ID of the author
   */
  async getStats(authorId: string) {
    try {
      const { data, error } = await this.supabase
        .from('author_stats')
        .select('*')
        .eq('author_id', authorId)
        .single();

      if (error) throw error;

      return { data };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_STATS_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch stats'
        }
      };
    }
  }
}

// Export singleton instance
export const dashboardService = new BaseDashboardService();

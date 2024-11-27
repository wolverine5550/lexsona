import { createClient } from '@/utils/supabase/client';
import type {
  DashboardStats,
  PodcastMatch,
  Interview,
  Activity,
  Notification,
  ApiResponse
} from '@/types/dashboard';

/**
 * Raw data types from Supabase responses
 */
interface RawPodcast {
  name: string;
  host_name: string;
}

interface RawMatch {
  id: string;
  podcast_id: string;
  podcast: RawPodcast;
  match_score: number;
  match_reason: string[];
  created_at: string;
  status: PodcastMatch['status'];
}

interface RawInterview {
  id: string;
  podcast_id: string;
  podcast: RawPodcast;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  status: Interview['status'];
  notes?: string;
  meeting_link?: string;
}

/**
 * Service class for handling all dashboard-related API calls
 * Uses Supabase for data storage and real-time updates
 */
export class DashboardService {
  private supabase = createClient();

  /**
   * Fetches overview statistics for the dashboard
   * @param userId - The current user's ID
   * @returns Promise with dashboard stats or error
   */
  async getStats(userId: string): Promise<ApiResponse<DashboardStats>> {
    try {
      const { data, error } = await this.supabase
        .from('author_stats')
        .select('*')
        .eq('author_id', userId)
        .single();

      if (error) throw error;

      // Transform raw data into DashboardStats type
      return {
        data: {
          totalMatches: data.total_matches,
          pendingRequests: data.pending_requests,
          upcomingInterviews: data.upcoming_interviews,
          profileViews: data.profile_views,
          lastUpdated: new Date(data.updated_at)
        }
      };
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

  /**
   * Fetches recent podcast matches for the author
   * @param userId - The current user's ID
   * @param limit - Number of matches to fetch (default: 5)
   */
  async getRecentMatches(
    userId: string,
    limit = 5
  ): Promise<ApiResponse<PodcastMatch[]>> {
    try {
      const { data, error } = await this.supabase
        .from('matches')
        .select(
          `
          id,
          podcast_id,
          podcast:podcasts(name, host_name),
          match_score,
          match_reason,
          created_at,
          status
        `
        )
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform the raw data into PodcastMatch type
      const matches: PodcastMatch[] = (data as unknown as RawMatch[]).map(
        (match) => ({
          id: match.id,
          podcastId: match.podcast_id,
          podcastName: match.podcast.name,
          hostName: match.podcast.host_name,
          matchScore: match.match_score,
          matchReason: match.match_reason,
          date: new Date(match.created_at),
          status: match.status
        })
      );

      return { data: matches };
    } catch (error) {
      return {
        error: {
          code: 'FETCH_MATCHES_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch matches'
        }
      };
    }
  }

  /**
   * Fetches upcoming interviews
   * @param userId - The current user's ID
   * @param status - Optional status filter
   */
  async getUpcomingInterviews(
    userId: string,
    status?: Interview['status']
  ): Promise<ApiResponse<Interview[]>> {
    try {
      let query = this.supabase
        .from('interviews')
        .select(
          `
          id,
          podcast_id,
          podcast:podcasts(name, host_name),
          scheduled_date,
          scheduled_time,
          duration,
          status,
          notes,
          meeting_link
        `
        )
        .eq('author_id', userId)
        .gte('scheduled_date', new Date().toISOString());

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('scheduled_date', {
        ascending: true
      });

      if (error) throw error;

      // Transform the raw data into Interview type
      const interviews: Interview[] = (data as unknown as RawInterview[]).map(
        (interview) => ({
          id: interview.id,
          podcastId: interview.podcast_id,
          podcastName: interview.podcast.name,
          hostName: interview.podcast.host_name,
          date: new Date(interview.scheduled_date),
          time: interview.scheduled_time,
          duration: interview.duration,
          status: interview.status,
          notes: interview.notes,
          meetingLink: interview.meeting_link
        })
      );

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
   * Updates the read status of a notification
   * @param notificationId - The ID of the notification to update
   * @param read - The new read status
   */
  async markNotificationRead(
    notificationId: string,
    read = true
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read })
        .eq('id', notificationId);

      if (error) throw error;
      return {};
    } catch (error) {
      return {
        error: {
          code: 'UPDATE_NOTIFICATION_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update notification'
        }
      };
    }
  }

  /**
   * Sets up real-time subscription for notifications
   * @param userId - The current user's ID
   * @param onUpdate - Callback function for updates
   * @returns Cleanup function to unsubscribe
   */
  subscribeToNotifications(
    userId: string,
    onUpdate: (notification: Notification) => void
  ): () => void {
    const subscription = this.supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate(this.transformNotification(payload.new));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Helper method to transform raw notification data
   */
  private transformNotification(raw: any): Notification {
    return {
      id: raw.id,
      type: raw.type,
      title: raw.title,
      description: raw.description,
      timestamp: new Date(raw.created_at),
      read: raw.read,
      priority: raw.priority,
      actionUrl: raw.action_url,
      metadata: raw.metadata
    };
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

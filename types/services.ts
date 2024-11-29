import type { Database } from './database';

/**
 * Type aliases for better readability
 */
type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

/**
 * Author related types
 */
export type Author = Tables['authors']['Row'] & {
  // Additional fields can be added here
};

/**
 * Match related types
 */
export interface MatchService {
  /**
   * Fetches recent matches for an author
   * @param authorId - The ID of the author
   * @param limit - Maximum number of matches to return (default: 10)
   * @param status - Optional status filter
   */
  getRecentMatches(
    authorId: string,
    limit?: number,
    status?: Enums['match_status']
  ): Promise<ApiResponse<Tables['matches']['Row'][]>>;

  /**
   * Updates the status of a match
   * @param matchId - The ID of the match to update
   * @param status - The new status
   */
  updateMatchStatus(
    matchId: string,
    status: Enums['match_status']
  ): Promise<ApiResponse<void>>;

  /**
   * Subscribes to new matches for an author
   * @param authorId - The ID of the author
   * @param callback - Callback for new matches
   */
  subscribeToMatches?: (
    authorId: string,
    callback: (match: Tables['matches']['Row']) => void
  ) => () => void;
}

/**
 * Interview related types
 */
export interface InterviewService {
  /**
   * Fetches upcoming interviews for an author
   * @param authorId - The ID of the author
   * @param status - Optional status filter
   */
  getUpcomingInterviews(
    authorId: string,
    status?: Enums['interview_status']
  ): Promise<ApiResponse<Tables['interviews']['Row'][]>>;

  /**
   * Schedules a new interview
   * @param data - The interview details
   */
  scheduleInterview(
    data: Tables['interviews']['Insert']
  ): Promise<ApiResponse<Tables['interviews']['Row']>>;

  /**
   * Updates an existing interview
   * @param interviewId - The ID of the interview to update
   * @param data - The fields to update
   */
  updateInterview(
    interviewId: string,
    data: Partial<Tables['interviews']['Update']>
  ): Promise<ApiResponse<void>>;
}

/**
 * Notification related types
 */
export interface NotificationService {
  /**
   * Fetches notifications for an author
   * @param authorId - The ID of the author
   * @param unreadOnly - Whether to fetch only unread notifications
   */
  getNotifications(
    authorId: string,
    unreadOnly?: boolean
  ): Promise<ApiResponse<Tables['notifications']['Row'][]>>;

  /**
   * Marks a notification as read
   * @param notificationId - The ID of the notification
   */
  markAsRead(notificationId: string): Promise<ApiResponse<void>>;

  /**
   * Sets up real-time notification subscription
   * @param authorId - The ID of the author
   * @param onNotification - Callback for new notifications
   */
  subscribeToNotifications(
    authorId: string,
    onNotification: (notification: Tables['notifications']['Row']) => void
  ): () => void;
}

/**
 * Activity related types
 */
export interface ActivityService {
  /**
   * Fetches recent activities for an author
   * @param authorId - The ID of the author
   * @param limit - Maximum number of activities to return
   */
  getRecentActivities(
    authorId: string,
    limit?: number
  ): Promise<ApiResponse<Database['public']['Tables']['activities']['Row'][]>>;

  createActivity(
    data: Database['public']['Tables']['activities']['Insert']
  ): Promise<ApiResponse<Database['public']['Tables']['activities']['Row']>>;

  getGroupedActivities(
    authorId: string,
    days?: number
  ): Promise<
    ApiResponse<
      {
        date: string;
        activities: Database['public']['Tables']['activities']['Row'][];
      }[]
    >
  >;
}

/**
 * Main dashboard service interface combining all sub-services
 */
export interface DashboardService {
  matches: MatchService;
  interviews: InterviewService;
  notifications: NotificationService;
  activities: ActivityService;

  /**
   * Fetches dashboard statistics for an author
   * @param authorId - The ID of the author
   */
  getStats(
    authorId: string
  ): Promise<ApiResponse<Database['public']['Views']['author_stats']['Row']>>;
}

/**
 * Generic API response type
 */
export type ApiResponse<T> = {
  data: T;
  error?: {
    message: string;
  };
};

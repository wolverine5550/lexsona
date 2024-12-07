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
 * Message related types
 */
export type MessageType = 'email' | 'notification' | 'ticket' | 'system';
export type MessageStatus = 'unread' | 'read' | 'archived';

export interface Message {
  id: string;
  user_id: string;
  type: MessageType;
  subject?: string;
  content: string;
  metadata?: {
    ticket_id?: string;
    sender_id?: string;
    sender_type?: 'user' | 'staff';
    priority?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Main dashboard service interface combining all sub-services
 */
export interface DashboardService {
  matches: MatchService;
  interviews: InterviewService;
  notifications: NotificationService;

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

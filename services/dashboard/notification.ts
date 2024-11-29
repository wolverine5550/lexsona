import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { NotificationService, ApiResponse } from '@/types/services';

type Notification = Database['public']['Tables']['notifications']['Row'];

/**
 * Implementation of the Notification Service
 * Handles all notification-related operations including:
 * - Fetching user notifications
 * - Marking notifications as read
 * - Real-time notification updates
 * - Notification filtering and sorting
 */
export class NotificationServiceImpl implements NotificationService {
  /**
   * Initialize service with Supabase client
   * @param supabase - Typed Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Fetches notifications for an author
   * Can filter for unread notifications only
   * Orders by creation date, newest first
   *
   * @param authorId - The ID of the author to fetch notifications for
   * @param unreadOnly - Whether to fetch only unread notifications
   * @returns Promise with notifications data or error
   */
  async getNotifications(
    authorId: string,
    unreadOnly = false
  ): Promise<ApiResponse<Notification[]>> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data: data || [] };
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
   * Marks a notification as read
   * Updates the read status and creates an activity record
   *
   * @param notificationId - The ID of the notification to mark as read
   * @returns Promise with success or error
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { data: undefined };
    } catch (error) {
      return {
        data: undefined,
        error: {
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
   * Notifies when new notifications are created
   * Useful for showing real-time notification badges/alerts
   *
   * @param authorId - The ID of the author to watch
   * @param onNotification - Callback function for new notifications
   * @returns Cleanup function to unsubscribe
   */
  subscribeToNotifications(
    authorId: string,
    onNotification: (
      notification: Database['public']['Tables']['notifications']['Row']
    ) => void
  ) {
    // Create a channel for this author's notifications
    const channel = this.supabase
      .channel(`notifications:${authorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen for new notifications
          schema: 'public',
          table: 'notifications',
          filter: `author_id=eq.${authorId}`
        },
        (payload) => {
          // Cast the payload to our known type and call the callback
          onNotification(
            payload.new as Database['public']['Tables']['notifications']['Row']
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

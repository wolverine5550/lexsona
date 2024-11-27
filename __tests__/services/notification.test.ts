import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotificationServiceImpl } from '@/services/dashboard/notification';
import type { Database } from '@/types/database';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Define mock Supabase client type
type MockSupabaseClient = {
  [K in keyof SupabaseClient<Database>]: ReturnType<typeof vi.fn>;
} & {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  channel: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

describe('NotificationServiceImpl', () => {
  let service: NotificationServiceImpl;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Setup mock responses with method chaining support
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    } as MockSupabaseClient;

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
    service = new NotificationServiceImpl(
      mockSupabase as unknown as SupabaseClient<Database>
    );
  });

  describe('getNotifications', () => {
    // Mock notification data for testing
    const mockNotifications = [
      {
        id: '1',
        author_id: 'author1',
        type: 'match',
        title: 'New Match',
        description: 'You have a new podcast match',
        read: false,
        priority: 'high',
        created_at: new Date().toISOString()
      }
    ];

    it('should fetch notifications successfully', async () => {
      // Setup mock response
      mockSupabase.select.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      const result = await service.getNotifications('author1');

      // Verify successful response
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.eq).toHaveBeenCalledWith('author_id', 'author1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false
      });
    });

    it('should filter unread notifications when requested', async () => {
      // Setup mock response for unread filter
      mockSupabase.select.mockResolvedValue({
        data: mockNotifications.filter((n) => !n.read),
        error: null
      });

      await service.getNotifications('author1', true);

      // Verify unread filter was applied
      expect(mockSupabase.eq).toHaveBeenCalledWith('read', false);
    });

    it('should handle fetch errors gracefully', async () => {
      // Setup error response
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await service.getNotifications('author1');

      // Verify error handling
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_NOTIFICATIONS_ERROR');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      // Setup successful update response
      mockSupabase.update.mockResolvedValue({ error: null });

      const result = await service.markAsRead('notification1');

      // Verify update was called correctly
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'notification1');
    });

    it('should handle update errors', async () => {
      // Setup error response
      mockSupabase.update.mockResolvedValue({
        error: new Error('Update failed')
      });

      const result = await service.markAsRead('notification1');

      // Verify error handling
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UPDATE_NOTIFICATION_ERROR');
    });
  });

  describe('subscribeToNotifications', () => {
    it('should set up real-time subscription correctly', () => {
      const mockCallback = vi.fn();
      const unsubscribe = service.subscribeToNotifications(
        'author1',
        mockCallback
      );

      // Verify subscription setup
      expect(mockSupabase.channel).toHaveBeenCalledWith(
        'notifications:author1'
      );
      expect(mockSupabase.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `author_id=eq.author1`
        },
        expect.any(Function)
      );
      expect(mockSupabase.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription cleanup', () => {
      const mockUnsubscribe = vi.fn();
      mockSupabase.subscribe.mockReturnValue({
        unsubscribe: mockUnsubscribe
      });

      const unsubscribe = service.subscribeToNotifications('author1', vi.fn());
      unsubscribe();

      // Verify cleanup
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

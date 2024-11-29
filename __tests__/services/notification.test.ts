import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { NotificationServiceImpl } from '@/services/dashboard/notification';
import type { Database } from '@/types/database';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

describe('NotificationServiceImpl', () => {
  let service: NotificationServiceImpl;
  let mockSupabase: any;

  const createQueryBuilder = (returnData: any = [], shouldError = false) => {
    const queryBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      update: vi.fn(),
      single: vi.fn(),
      then: vi.fn((callback: any) =>
        Promise.resolve(
          callback({
            data: shouldError ? null : returnData,
            error: shouldError ? new Error('Database error') : null
          })
        )
      )
    };

    // Setup method chaining
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.eq.mockReturnValue(queryBuilder);
    queryBuilder.order.mockReturnValue(queryBuilder);
    queryBuilder.update.mockReturnValue(queryBuilder);
    queryBuilder.single.mockReturnValue(queryBuilder);

    return queryBuilder;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnValue(createQueryBuilder()),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn()
      })
    };

    (createClient as any).mockReturnValue(mockSupabase);
    service = new NotificationServiceImpl(mockSupabase);
  });

  describe('getNotifications', () => {
    const mockNotifications = [
      {
        id: '1',
        author_id: 'author1',
        type: 'match' as const,
        title: 'New Match',
        description: 'You have a new podcast match',
        read: false,
        created_at: new Date().toISOString()
      }
    ];

    it('should fetch notifications successfully', async () => {
      const queryBuilder = createQueryBuilder(mockNotifications);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getNotifications('author1');

      expect(result.data).toEqual(mockNotifications);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(queryBuilder.eq).toHaveBeenCalledWith('author_id', 'author1');
    });

    it('should filter unread notifications when requested', async () => {
      const queryBuilder = createQueryBuilder(mockNotifications);
      mockSupabase.from.mockReturnValue(queryBuilder);

      await service.getNotifications('author1', true);

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(queryBuilder.eq).toHaveBeenCalledWith('author_id', 'author1');
      expect(queryBuilder.eq).toHaveBeenCalledWith('read', false);
    });

    it('should handle fetch errors gracefully', async () => {
      const queryBuilder = createQueryBuilder([], true);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getNotifications('author1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const queryBuilder = createQueryBuilder({ success: true });
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.markAsRead('notification1');

      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(queryBuilder.update).toHaveBeenCalledWith({ read: true });
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'notification1');
    });

    it('should handle update errors', async () => {
      const queryBuilder = createQueryBuilder(null, true);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.markAsRead('notification1');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
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

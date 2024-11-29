import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { ActivityServiceImpl } from '@/services/dashboard/activity';
import type { Database } from '@/types/database';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

describe('ActivityServiceImpl', () => {
  let service: ActivityServiceImpl;
  let mockSupabase: any;

  const createQueryBuilder = (returnData: any = [], shouldError = false) => {
    const queryBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
      insert: vi.fn(),
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
    queryBuilder.gte.mockReturnValue(queryBuilder);
    queryBuilder.order.mockReturnValue(queryBuilder);
    queryBuilder.limit.mockReturnValue(queryBuilder);
    queryBuilder.single.mockReturnValue(queryBuilder);
    queryBuilder.insert.mockReturnValue(queryBuilder);

    return queryBuilder;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnValue(createQueryBuilder())
    };

    (createClient as any).mockReturnValue(mockSupabase);
    service = new ActivityServiceImpl(mockSupabase);
  });

  describe('getRecentActivities', () => {
    const mockActivities = [
      {
        id: '1',
        author_id: 'author1',
        type: 'match',
        title: 'New Match',
        description: 'Found a new podcast match',
        created_at: new Date().toISOString()
      }
    ];

    it('should fetch recent activities successfully', async () => {
      const queryBuilder = createQueryBuilder(mockActivities);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecentActivities('author1');

      expect(result.data).toEqual(mockActivities);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(queryBuilder.eq).toHaveBeenCalledWith('author_id', 'author1');
    });

    it('should respect custom limit parameter', async () => {
      const queryBuilder = createQueryBuilder(mockActivities);
      mockSupabase.from.mockReturnValue(queryBuilder);

      await service.getRecentActivities('author1', 1);

      expect(queryBuilder.limit).toHaveBeenCalledWith(1);
    });

    it('should handle fetch errors gracefully', async () => {
      const queryBuilder = createQueryBuilder([], true);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecentActivities('author1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
    });
  });

  describe('getGroupedActivities', () => {
    const mockActivities = [
      {
        id: '1',
        author_id: 'author1',
        type: 'match',
        title: 'Activity 1',
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        author_id: 'author1',
        type: 'match',
        title: 'Activity 2',
        created_at: '2024-01-02T10:00:00Z'
      }
    ];

    it('should group activities by date', async () => {
      const queryBuilder = createQueryBuilder(mockActivities);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getGroupedActivities('author1');

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2); // Two different dates
      expect(result.data[0]).toHaveProperty('date');
      expect(result.data[0]).toHaveProperty('activities');
    });

    it('should respect days parameter', async () => {
      const queryBuilder = createQueryBuilder(mockActivities);
      mockSupabase.from.mockReturnValue(queryBuilder);

      await service.getGroupedActivities('author1', 7);

      expect(queryBuilder.gte).toHaveBeenCalled();
    });

    it('should handle grouping errors', async () => {
      const queryBuilder = createQueryBuilder([], true);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getGroupedActivities('author1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
    });
  });
});

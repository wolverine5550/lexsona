import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ActivityServiceImpl } from '@/services/dashboard/activity';
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
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

describe('ActivityServiceImpl', () => {
  let service: ActivityServiceImpl;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Setup mock responses with method chaining support
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis()
    } as MockSupabaseClient;

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
    service = new ActivityServiceImpl(
      mockSupabase as unknown as SupabaseClient<Database>
    );
  });

  describe('getRecentActivities', () => {
    // Mock activity data for testing
    const mockActivities = [
      {
        id: '1',
        author_id: 'author1',
        type: 'match',
        title: 'New Match',
        description: 'Matched with Test Podcast',
        metadata: { podcast_id: 'pod1' },
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        author_id: 'author1',
        type: 'interview',
        title: 'Interview Scheduled',
        description: 'Interview scheduled with Test Podcast',
        metadata: { podcast_id: 'pod1', interview_id: 'int1' },
        created_at: new Date().toISOString()
      }
    ];

    it('should fetch recent activities successfully', async () => {
      // Setup mock response
      mockSupabase.select.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      const result = await service.getRecentActivities('author1');

      // Verify successful response
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.eq).toHaveBeenCalledWith('author_id', 'author1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
        ascending: false
      });
      expect(mockSupabase.limit).toHaveBeenCalledWith(20); // Default limit
    });

    it('should respect custom limit parameter', async () => {
      // Setup mock response
      mockSupabase.select.mockResolvedValue({
        data: mockActivities.slice(0, 1),
        error: null
      });

      await service.getRecentActivities('author1', 1);

      // Verify limit was applied
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
    });

    it('should handle fetch errors gracefully', async () => {
      // Setup error response
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await service.getRecentActivities('author1');

      // Verify error handling
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_ACTIVITIES_ERROR');
    });
  });

  describe('createActivity', () => {
    const mockActivityData = {
      author_id: 'author1',
      type: 'match' as const,
      title: 'New Match',
      description: 'Matched with Test Podcast',
      metadata: { podcast_id: 'pod1' }
    };

    it('should create activity successfully', async () => {
      // Setup mock response
      const mockCreatedActivity = {
        ...mockActivityData,
        id: '1',
        created_at: new Date().toISOString()
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedActivity,
        error: null
      });

      const result = await service.createActivity(mockActivityData);

      // Verify successful creation
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('activities');
      expect(mockSupabase.insert).toHaveBeenCalledWith([mockActivityData]);
    });

    it('should handle creation errors', async () => {
      // Setup error response
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Creation failed')
      });

      const result = await service.createActivity(mockActivityData);

      // Verify error handling
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('CREATE_ACTIVITY_ERROR');
    });
  });

  describe('getGroupedActivities', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Mock activities on different dates
    const mockActivities = [
      {
        id: '1',
        author_id: 'author1',
        type: 'match',
        title: 'Today Activity',
        description: 'Test activity',
        created_at: today.toISOString()
      },
      {
        id: '2',
        author_id: 'author1',
        type: 'interview',
        title: 'Yesterday Activity',
        description: 'Test activity',
        created_at: yesterday.toISOString()
      }
    ];

    it('should group activities by date', async () => {
      // Setup mock response
      mockSupabase.select.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      const result = await service.getGroupedActivities('author1');

      // Verify grouping
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(2); // Two different dates
      expect(result.data?.[0]).toHaveProperty('date');
      expect(result.data?.[0]).toHaveProperty('activities');
    });

    it('should respect days parameter', async () => {
      // Setup mock response
      mockSupabase.select.mockResolvedValue({
        data: mockActivities,
        error: null
      });

      await service.getGroupedActivities('author1', 3);

      // Verify date filter
      expect(mockSupabase.gte).toHaveBeenCalled();
    });

    it('should handle grouping errors', async () => {
      // Setup error response
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Fetch failed')
      });

      const result = await service.getGroupedActivities('author1');

      // Verify error handling
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_GROUPED_ACTIVITIES_ERROR');
    });
  });
});

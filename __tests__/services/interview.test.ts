import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { InterviewServiceImpl } from '@/services/dashboard/interview';
import type { Database } from '@/types/database';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

describe('InterviewServiceImpl', () => {
  let service: InterviewServiceImpl;
  let mockSupabase: any;
  let createMockQuery: (returnData?: any) => any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock query chain that matches Supabase's behavior
    createMockQuery = (returnData: any = []) => {
      const query = {
        select: vi.fn(),
        eq: vi.fn(),
        gte: vi.fn(),
        order: vi.fn(),
        single: vi.fn(),
        then: vi.fn((callback) =>
          Promise.resolve(
            callback({
              data: returnData,
              error: null,
              count: null,
              status: 200,
              statusText: 'OK'
            })
          )
        )
      };

      // Setup method chaining
      query.select.mockReturnValue(query);
      query.eq.mockReturnValue(query);
      query.gte.mockReturnValue(query);
      query.order.mockReturnValue(query);
      query.single.mockReturnValue(query);

      return query;
    };

    mockSupabase = {
      from: vi.fn()
    };

    (createClient as any).mockReturnValue(mockSupabase);
    service = new InterviewServiceImpl(mockSupabase);
  });

  describe('getUpcomingInterviews', () => {
    const mockInterviews = [
      {
        id: '1',
        author_id: 'author1',
        podcast_id: 'pod1',
        scheduled_date: '2024-01-01',
        scheduled_time: '10:00:00',
        duration: 60,
        status: 'scheduled' as const,
        notes: 'Test notes',
        meeting_link: 'https://meet.test'
      }
    ];

    it('should fetch upcoming interviews successfully', async () => {
      // Setup mock query with data
      const query = createMockQuery(mockInterviews);
      mockSupabase.from.mockReturnValue(query);

      const result = await service.getUpcomingInterviews('author1');

      expect(result.data).toEqual(mockInterviews);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
      expect(query.select).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('author_id', 'author1');
      expect(query.gte).toHaveBeenCalled();
      expect(query.order).toHaveBeenCalled();
    });

    it('should apply status filter when provided', async () => {
      // Setup mock query with empty data
      const query = createMockQuery([]);
      mockSupabase.from.mockReturnValue(query);

      await service.getUpcomingInterviews('author1', 'scheduled');

      expect(mockSupabase.from).toHaveBeenCalledWith('interviews');
      expect(query.select).toHaveBeenCalled();
      expect(query.eq).toHaveBeenCalledWith('author_id', 'author1');
      expect(query.eq).toHaveBeenCalledWith('status', 'scheduled');
      expect(query.gte).toHaveBeenCalled();
      expect(query.order).toHaveBeenCalled();

      // Verify call order
      const calls = query.eq.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual(['author_id', 'author1']);
      expect(calls[1]).toEqual(['status', 'scheduled']);
    });
  });
});

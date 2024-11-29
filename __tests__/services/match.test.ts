import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { MatchServiceImpl } from '@/services/dashboard/match';
import type { Database } from '@/types/database';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

describe('MatchServiceImpl', () => {
  let service: MatchServiceImpl;
  let mockSupabase: any;

  const createQueryBuilder = (returnData: any = [], shouldError = false) => {
    const queryBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      single: vi.fn(),
      rpc: vi.fn(),
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
    queryBuilder.limit.mockReturnValue(queryBuilder);
    queryBuilder.single.mockReturnValue(queryBuilder);
    queryBuilder.rpc.mockReturnValue(queryBuilder);

    return queryBuilder;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnValue(createQueryBuilder()),
      rpc: vi.fn().mockReturnValue(createQueryBuilder()),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn()
      })
    };

    (createClient as any).mockReturnValue(mockSupabase);
    service = new MatchServiceImpl(mockSupabase);
  });

  describe('getRecentMatches', () => {
    const mockMatches = [
      {
        id: '1',
        author_id: 'author1',
        podcast_id: 'pod1',
        match_score: 0.9,
        match_reason: ['topic match'],
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    it('should fetch matches successfully', async () => {
      const queryBuilder = createQueryBuilder(mockMatches);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecentMatches('author1');

      expect(result.data).toEqual(mockMatches);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('matches');
      expect(queryBuilder.eq).toHaveBeenCalledWith('author_id', 'author1');
    });

    it('should handle errors gracefully', async () => {
      const queryBuilder = createQueryBuilder([], true);
      mockSupabase.from.mockReturnValue(queryBuilder);

      const result = await service.getRecentMatches('author1');

      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
    });

    it('should apply status filter when provided', async () => {
      const queryBuilder = createQueryBuilder([]);
      mockSupabase.from.mockReturnValue(queryBuilder);

      await service.getRecentMatches('author1', 10, 'viewed');

      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'viewed');
    });
  });

  describe('updateMatchStatus', () => {
    it('should update match status successfully', async () => {
      const queryBuilder = createQueryBuilder({ success: true });
      mockSupabase.rpc.mockReturnValue(queryBuilder);

      const result = await service.updateMatchStatus('match1', 'viewed');

      expect(result.error).toBeUndefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_match_status', {
        p_match_id: 'match1',
        p_status: 'viewed'
      });
    });

    it('should handle update errors', async () => {
      const queryBuilder = createQueryBuilder(null, true);
      mockSupabase.rpc.mockReturnValue(queryBuilder);

      const result = await service.updateMatchStatus('match1', 'viewed');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database error');
    });
  });

  describe('subscribeToMatches', () => {
    it('should set up subscription correctly', () => {
      const mockCallback = vi.fn();
      const unsubscribe = service.subscribeToMatches('author1', mockCallback);

      expect(mockSupabase.channel).toHaveBeenCalledWith('matches:author1');
      expect(mockSupabase.on).toHaveBeenCalled();
      expect(mockSupabase.subscribe).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should handle subscription cleanup', () => {
      const mockUnsubscribe = vi.fn();
      mockSupabase.subscribe.mockReturnValue({
        unsubscribe: mockUnsubscribe
      });

      const unsubscribe = service.subscribeToMatches('author1', vi.fn());
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

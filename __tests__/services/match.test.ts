import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatchServiceImpl } from '@/services/dashboard/match';
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
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  channel: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

describe('MatchServiceImpl', () => {
  let service: MatchServiceImpl;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Setup mock responses
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      rpc: vi.fn().mockReturnThis(),
      channel: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis()
    } as MockSupabaseClient;

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
    service = new MatchServiceImpl(
      mockSupabase as unknown as SupabaseClient<Database>
    );
  });

  describe('getRecentMatches', () => {
    it('should fetch matches successfully', async () => {
      const mockMatches = [
        {
          id: '1',
          author_id: 'author1',
          podcast_id: 'pod1',
          match_score: 0.9,
          match_reason: ['topic match'],
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          podcast: {
            id: 'pod1',
            title: 'Test Podcast',
            publisher: 'Test Publisher'
          }
        }
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockMatches,
        error: null
      });

      const result = await service.getRecentMatches('author1');

      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('matches');
      expect(mockSupabase.eq).toHaveBeenCalledWith('author_id', 'author1');
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await service.getRecentMatches('author1');

      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('FETCH_MATCHES_ERROR');
    });

    it('should apply status filter when provided', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      });

      await service.getRecentMatches('author1', 10, 'viewed');

      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'viewed');
    });
  });

  describe('updateMatchStatus', () => {
    it('should update match status successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const result = await service.updateMatchStatus('match1', 'viewed');

      expect(result.error).toBeUndefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_match_status', {
        p_match_id: 'match1',
        p_status: 'viewed'
      });
    });

    it('should handle update errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        error: new Error('Update failed')
      });

      const result = await service.updateMatchStatus('match1', 'viewed');

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UPDATE_MATCH_ERROR');
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

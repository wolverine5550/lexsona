import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavedMatchesService } from '@/services/saved-matches';
import { createClient } from '@/utils/supabase/client';
import type { SavedMatch, MatchStatus } from '@/types/saved-match';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('SavedMatchesService', () => {
  const mockMatch: SavedMatch = {
    id: '123',
    authorId: 'author123',
    podcastId: 'podcast123',
    matchScore: 0.85,
    matchReasons: ['topic match', 'audience match'],
    status: 'viewed' as MatchStatus,
    isBookmarked: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMatches', () => {
    it('should handle pagination', async () => {
      const mockResponse = { data: [mockMatch], error: null };

      const queryBuilder = {
        data: null,
        error: null,
        select: function () {
          return this;
        },
        eq: function () {
          return this;
        },
        order: function () {
          return this;
        },
        limit: function () {
          return this;
        },
        then: function (callback: Function) {
          return Promise.resolve(callback(mockResponse));
        }
      };

      vi.spyOn(queryBuilder, 'select');
      vi.spyOn(queryBuilder, 'eq');
      vi.spyOn(queryBuilder, 'order');
      vi.spyOn(queryBuilder, 'limit');

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder)
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const result = await SavedMatchesService.getMatches({
        authorId: mockMatch.authorId,
        limit: 10,
        offset: 0
      });

      expect(result).toEqual([mockMatch]);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
      expect(queryBuilder.select).toHaveBeenCalledWith('*');
      expect(queryBuilder.eq).toHaveBeenCalledWith(
        'author_id',
        mockMatch.authorId
      );
      expect(queryBuilder.order).toHaveBeenCalledWith('match_score', {
        ascending: false
      });
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should handle pagination with limit only', async () => {
      const mockResponse = { data: [mockMatch], error: null };

      const queryBuilder = {
        data: null,
        error: null,
        select: function () {
          return this;
        },
        eq: function () {
          return this;
        },
        order: function () {
          return this;
        },
        limit: function () {
          return this;
        },
        then: function (callback: Function) {
          return Promise.resolve(callback(mockResponse));
        }
      };

      vi.spyOn(queryBuilder, 'select');
      vi.spyOn(queryBuilder, 'eq');
      vi.spyOn(queryBuilder, 'order');
      vi.spyOn(queryBuilder, 'limit');

      const mockSupabase = {
        from: vi.fn().mockReturnValue(queryBuilder)
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const result = await SavedMatchesService.getMatches({
        authorId: mockMatch.authorId,
        limit: 10
      });

      expect(result).toEqual([mockMatch]);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
      expect(queryBuilder.select).toHaveBeenCalledWith('*');
      expect(queryBuilder.eq).toHaveBeenCalledWith(
        'author_id',
        mockMatch.authorId
      );
      expect(queryBuilder.order).toHaveBeenCalledWith('match_score', {
        ascending: false
      });
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });
});

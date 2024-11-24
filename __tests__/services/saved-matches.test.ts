import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavedMatchesService } from '@/services/saved-matches';
import { createClient } from '@/utils/supabase/client';
import type { SavedMatch, MatchStatus } from '@/types/saved-match';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a more specific mock type
type MockSupabaseClient = {
  from: (table: string) => any;
} & Partial<SupabaseClient>;

// Mock Supabase client
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

  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client for each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis()
      })
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('saveMatch', () => {
    it('should successfully save a new match', async () => {
      const mockResponse = { data: mockMatch, error: null };
      mockSupabase.from('saved_matches').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await SavedMatchesService.saveMatch(
        mockMatch.authorId,
        mockMatch.podcastId,
        mockMatch.matchScore,
        mockMatch.matchReasons
      );

      expect(result).toEqual(mockMatch);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
    });

    it('should handle duplicate match error', async () => {
      const mockError = {
        data: null,
        error: { code: '23505', message: 'Duplicate error' }
      };
      mockSupabase.from('saved_matches').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockError);

      await expect(
        SavedMatchesService.saveMatch(
          mockMatch.authorId,
          mockMatch.podcastId,
          mockMatch.matchScore,
          mockMatch.matchReasons
        )
      ).rejects.toThrow('This podcast match has already been saved');
    });
  });

  describe('updateStatus', () => {
    it('should update match status successfully', async () => {
      const updatedMatch = { ...mockMatch, status: 'contacted' as MatchStatus };
      const mockResponse = { data: updatedMatch, error: null };
      mockSupabase.from('saved_matches').update().eq().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await SavedMatchesService.updateStatus(
        mockMatch.id,
        'contacted'
      );

      expect(result).toEqual(updatedMatch);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
    });
  });

  describe('toggleBookmark', () => {
    it('should toggle bookmark status', async () => {
      // Mock current bookmark status
      mockSupabase.from('saved_matches').select().eq().single = vi
        .fn()
        .mockResolvedValue({
          data: { is_bookmarked: false },
          error: null
        });

      // Mock update
      mockSupabase.from('saved_matches').update().eq = vi
        .fn()
        .mockResolvedValue({
          data: null,
          error: null
        });

      const result = await SavedMatchesService.toggleBookmark(mockMatch.id);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
    });
  });

  describe('getMatches', () => {
    it('should fetch matches with filters', async () => {
      const mockResponse = { data: [mockMatch], error: null };
      mockSupabase.from('saved_matches').select().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await SavedMatchesService.getMatches({
        authorId: mockMatch.authorId,
        status: 'viewed',
        isBookmarked: false
      });

      expect(result).toEqual([mockMatch]);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
    });

    it('should handle pagination', async () => {
      const mockResponse = { data: [mockMatch], error: null };
      mockSupabase.from('saved_matches').select().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await SavedMatchesService.getMatches({
        authorId: mockMatch.authorId,
        limit: 10,
        offset: 0
      });

      expect(result).toEqual([mockMatch]);
      expect(mockSupabase.from).toHaveBeenCalledWith('saved_matches');
    });
  });
});

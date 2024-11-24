import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesService } from '@/services/favorites';
import { createClient } from '@/utils/supabase/client';
import type {
  PodcastCollection,
  PodcastTag,
  CollectionItem
} from '@/types/favorites';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a more specific mock type
type MockSupabaseClient = {
  from: (table: string) => any;
} & Partial<SupabaseClient>;

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('FavoritesService', () => {
  // Mock data setup
  const mockCollection: PodcastCollection = {
    id: 'col123',
    authorId: 'author123',
    name: 'My Favorites',
    description: 'Top podcast picks',
    isDefault: false,
    podcastCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTag: PodcastTag = {
    id: 'tag123',
    authorId: 'author123',
    name: 'High Priority',
    color: '#FF0000',
    useCount: 0,
    createdAt: new Date()
  };

  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase client for each test
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis()
      })
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('createCollection', () => {
    it('should create a new collection successfully', async () => {
      const mockResponse = { data: mockCollection, error: null };
      mockSupabase.from('podcast_collections').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await FavoritesService.createCollection(
        mockCollection.authorId,
        mockCollection.name,
        mockCollection.description
      );

      expect(result).toEqual(mockCollection);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_collections');
    });

    it('should handle duplicate collection names', async () => {
      const mockError = { code: '23505', message: 'Duplicate collection' };
      mockSupabase.from('podcast_collections').insert().select().single = vi
        .fn()
        .mockResolvedValue({
          data: null,
          error: mockError
        });

      await expect(
        FavoritesService.createCollection(
          mockCollection.authorId,
          mockCollection.name
        )
      ).rejects.toThrow('Collection "My Favorites" already exists');
    });
  });

  describe('addToCollection', () => {
    it('should add a podcast to a collection', async () => {
      mockSupabase.from('collection_items').insert = vi
        .fn()
        .mockResolvedValue({ error: null });

      await expect(
        FavoritesService.addToCollection(
          mockCollection.id,
          'match123',
          'Great potential'
        )
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('collection_items');
    });

    it('should handle duplicate additions', async () => {
      const mockError = { code: '23505', message: 'Duplicate entry' };
      mockSupabase.from('collection_items').insert = vi
        .fn()
        .mockResolvedValue({ error: mockError });

      await expect(
        FavoritesService.addToCollection(mockCollection.id, 'match123')
      ).rejects.toThrow('Podcast is already in this collection');
    });
  });

  describe('createTag', () => {
    it('should create a new tag successfully', async () => {
      const mockResponse = { data: mockTag, error: null };
      mockSupabase.from('podcast_tags').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await FavoritesService.createTag(
        mockTag.authorId,
        mockTag.name,
        mockTag.color
      );

      expect(result).toEqual(mockTag);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_tags');
    });

    it('should handle duplicate tag names', async () => {
      const mockError = { code: '23505', message: 'Duplicate tag' };
      mockSupabase.from('podcast_tags').insert().select().single = vi
        .fn()
        .mockResolvedValue({
          data: null,
          error: mockError
        });

      await expect(
        FavoritesService.createTag(mockTag.authorId, mockTag.name)
      ).rejects.toThrow('Tag "High Priority" already exists');
    });
  });

  describe('getCollections', () => {
    it('should fetch collections with filters', async () => {
      const mockResponse = { data: [mockCollection], error: null };
      mockSupabase.from('podcast_collections').select().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await FavoritesService.getCollections({
        authorId: mockCollection.authorId,
        includeEmpty: false,
        searchTerm: 'Favorites'
      });

      expect(result).toEqual([mockCollection]);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_collections');
    });
  });

  describe('getTags', () => {
    it('should fetch active tags', async () => {
      const mockResponse = { data: [mockTag], error: null };
      mockSupabase.from('podcast_tags').select().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await FavoritesService.getTags(mockTag.authorId, true);

      expect(result).toEqual([mockTag]);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_tags');
    });
  });

  describe('removeFromCollection', () => {
    it('should remove a podcast from a collection', async () => {
      mockSupabase.from('collection_items').delete().match = vi
        .fn()
        .mockResolvedValue({ error: null });

      await expect(
        FavoritesService.removeFromCollection(mockCollection.id, 'match123')
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('collection_items');
    });
  });

  describe('removeTag', () => {
    it('should remove a tag from a match', async () => {
      mockSupabase.from('match_tags').delete().match = vi
        .fn()
        .mockResolvedValue({ error: null });

      await expect(
        FavoritesService.removeTag(mockTag.id, 'match123')
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('match_tags');
    });
  });
});

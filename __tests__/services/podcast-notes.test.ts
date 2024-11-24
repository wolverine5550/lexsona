import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PodcastNotesService } from '@/services/podcast-notes';
import { createClient } from '@/utils/supabase/client';
import type {
  PodcastNote,
  NoteCategory,
  MatchFeedback
} from '@/types/podcast-notes';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create a more specific mock type
type MockSupabaseClient = {
  from: (table: string) => any;
} & Partial<SupabaseClient>;

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('PodcastNotesService', () => {
  const mockNote: PodcastNote = {
    id: '123',
    matchId: 'match123',
    authorId: 'author123',
    category: 'preparation' as NoteCategory,
    content: 'Test note content',
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockFeedback: MatchFeedback = {
    isRelevant: true,
    audienceMatch: 4,
    topicMatch: 5,
    comments: 'Great match!'
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
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis()
      })
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('addNote', () => {
    it('should successfully add a new note', async () => {
      const mockResponse = { data: mockNote, error: null };
      mockSupabase.from('podcast_notes').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await PodcastNotesService.addNote(
        mockNote.matchId,
        mockNote.authorId,
        mockNote.category,
        mockNote.content
      );

      expect(result).toEqual(mockNote);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });

    it('should add a note with feedback', async () => {
      const noteWithFeedback = { ...mockNote, feedback: mockFeedback };
      const mockResponse = { data: noteWithFeedback, error: null };
      mockSupabase.from('podcast_notes').insert().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await PodcastNotesService.addNote(
        mockNote.matchId,
        mockNote.authorId,
        mockNote.category,
        mockNote.content,
        mockFeedback
      );

      expect(result).toEqual(noteWithFeedback);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });
  });

  describe('updateNote', () => {
    it('should update note content', async () => {
      const updatedNote = { ...mockNote, content: 'Updated content' };
      const mockResponse = { data: updatedNote, error: null };
      mockSupabase.from('podcast_notes').update().eq().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await PodcastNotesService.updateNote(mockNote.id, {
        content: 'Updated content'
      });

      expect(result).toEqual(updatedNote);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });

    it('should toggle pin status', async () => {
      const pinnedNote = { ...mockNote, isPinned: true };
      const mockResponse = { data: pinnedNote, error: null };
      mockSupabase.from('podcast_notes').update().eq().select().single = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await PodcastNotesService.updateNote(mockNote.id, {
        isPinned: true
      });

      expect(result).toEqual(pinnedNote);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });
  });

  describe('getNotes', () => {
    it('should fetch notes for a match', async () => {
      const mockResponse = { data: [mockNote], error: null };
      mockSupabase.from('podcast_notes').select().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await PodcastNotesService.getNotes({
        matchId: mockNote.matchId,
        authorId: mockNote.authorId
      });

      expect(result).toEqual([mockNote]);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });

    it('should filter by category', async () => {
      const mockResponse = { data: [mockNote], error: null };
      mockSupabase.from('podcast_notes').select().eq().eq().order = vi
        .fn()
        .mockResolvedValue(mockResponse);

      const result = await PodcastNotesService.getNotes({
        matchId: mockNote.matchId,
        authorId: mockNote.authorId,
        category: 'preparation'
      });

      expect(result).toEqual([mockNote]);
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      const mockResponse = { error: null };
      mockSupabase.from('podcast_notes').delete().eq = vi
        .fn()
        .mockResolvedValue(mockResponse);

      await expect(
        PodcastNotesService.deleteNote(mockNote.id)
      ).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith('podcast_notes');
    });
  });
});

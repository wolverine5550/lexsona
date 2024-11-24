import { createClient } from '@/utils/supabase/client';
import type {
  PodcastNote,
  NoteCategory,
  MatchFeedback,
  NotesQuery
} from '@/types/podcast-notes';

/**
 * Service for managing detailed notes and feedback on podcast matches
 */
export class PodcastNotesService {
  /**
   * Add a new note to a podcast match
   * @param matchId - ID of the saved match
   * @param authorId - ID of the author
   * @param category - Category of the note
   * @param content - Note content
   * @param feedback - Optional feedback about match quality
   */
  static async addNote(
    matchId: string,
    authorId: string,
    category: NoteCategory,
    content: string,
    feedback?: MatchFeedback
  ): Promise<PodcastNote> {
    const supabase = createClient();

    const newNote = {
      match_id: matchId,
      author_id: authorId,
      category,
      content,
      feedback,
      is_pinned: false
    };

    const { data, error } = await supabase
      .from('podcast_notes')
      .insert(newNote)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add note: ${error.message}`);
    }

    return data as PodcastNote;
  }

  /**
   * Update an existing note
   * @param noteId - ID of the note to update
   * @param updates - Fields to update
   */
  static async updateNote(
    noteId: string,
    updates: Partial<
      Pick<PodcastNote, 'content' | 'category' | 'feedback' | 'isPinned'>
    >
  ): Promise<PodcastNote> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('podcast_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update note: ${error.message}`);
    }

    return data as PodcastNote;
  }

  /**
   * Get all notes for a specific match
   * @param query - Query parameters for filtering notes
   */
  static async getNotes(query: NotesQuery): Promise<PodcastNote[]> {
    const supabase = createClient();

    let notesQuery = supabase
      .from('podcast_notes')
      .select('*')
      .eq('match_id', query.matchId)
      .eq('author_id', query.authorId);

    if (query.category) {
      notesQuery = notesQuery.eq('category', query.category);
    }

    if (query.isPinned !== undefined) {
      notesQuery = notesQuery.eq('is_pinned', query.isPinned);
    }

    const { data, error } = await notesQuery.order('created_at', {
      ascending: false
    });

    if (error) {
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return data as PodcastNote[];
  }

  /**
   * Delete a note
   * @param noteId - ID of the note to delete
   */
  static async deleteNote(noteId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('podcast_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      throw new Error(`Failed to delete note: ${error.message}`);
    }
  }
}

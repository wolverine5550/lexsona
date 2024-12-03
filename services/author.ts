import { createClient } from '@/utils/supabase/server';
import { Author, AuthorWork, AuthorInterview } from '@/types/author';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Type for the raw Supabase response
type SupabasePodcastMatch = {
  id: string;
  status: string;
  created_at: string;
  podcasts: {
    id: string;
    title: string;
    publisher: string;
    image: string;
  };
};

export class AuthorService {
  /**
   * Get complete author profile including works and interviews
   */
  static async getAuthor(id: string): Promise<Author | null> {
    const supabase = createClient();

    // Get user and author profile
    const [userResult, profileResult, booksResult, matchesResult] =
      await Promise.all([
        // Get user data
        supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', id)
          .single(),

        // Get author profile
        supabase
          .from('author_profiles')
          .select('bio, expertise, social_links, created_at')
          .eq('id', id)
          .single(),

        // Get books
        supabase
          .from('books')
          .select('*')
          .eq('author_id', id)
          .order('created_at', { ascending: false }),

        // Get podcast matches with their associated podcast data
        supabase
          .from('podcast_matches')
          .select(
            `
          id,
          status,
          created_at,
          podcasts:podcasts!inner (
            id,
            title,
            publisher,
            image
          )
        `
          )
          .eq('author_id', id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
      ]);

    // Return null if user not found
    if (!userResult.data || !profileResult.data) {
      return null;
    }

    // Transform books into AuthorWork type
    const works: AuthorWork[] = (booksResult.data || []).map((book) => ({
      id: book.id,
      title: book.title,
      coverImage: book.cover_url || '',
      publishDate: book.created_at,
      publisher: 'Self Published', // TODO: Add publisher field to books table
      genre: book.genre || [],
      description: book.description || ''
    }));

    // Transform podcast matches into AuthorInterview type
    const matches = matchesResult.data || [];
    const interviews: AuthorInterview[] = matches.map((match) => {
      const typedMatch = match as unknown as SupabasePodcastMatch;
      return {
        id: typedMatch.id,
        title: typedMatch.podcasts.title,
        podcastName: typedMatch.podcasts.publisher,
        date: typedMatch.created_at,
        duration: '30 min', // TODO: Add duration field to podcast_matches
        listenerCount: 0, // TODO: Add listener count tracking
        episodeUrl: '' // TODO: Add episode URL field to podcast_matches
      };
    });

    // Calculate stats
    const totalListens = interviews.reduce(
      (sum, interview) => sum + interview.listenerCount,
      0
    );

    return {
      id: userResult.data.id,
      name: userResult.data.full_name,
      avatar: userResult.data.avatar_url || '',
      bio: profileResult.data.bio || '',
      location: '', // TODO: Add location field to author_profiles
      joinedDate: profileResult.data.created_at,
      socialLinks: profileResult.data.social_links || {},
      works,
      interviews,
      followers: 0, // TODO: Add followers system
      following: 0, // TODO: Add following system
      totalListens
    };
  }

  /**
   * Get author analytics data
   */
  static async getAuthorAnalytics(id: string): Promise<Author | null> {
    // For MVP, we'll reuse the getAuthor method
    // TODO: Add specific analytics data when we implement analytics tracking
    return this.getAuthor(id);
  }
}

import { createClient } from '@/utils/supabase/client';
import { AuthorAnalyzer } from './author-analyzer';
import type { Author, AuthorProfile, AuthorBook } from '@/types/author';

// Define the podcast preferences type based on our Supabase table
interface PodcastPreferences {
  example_shows: string[];
  interview_topics: string[];
  target_audiences: string[];
  preferred_episode_length: string;
  preferred_formats: string[];
  content_restrictions: string | null;
  additional_notes: string | null;
  style_preferences: {
    isDebatePreferred: boolean;
    isInterviewPreferred: boolean;
    isEducationalPreferred: boolean;
    isStorytellingPreferred: boolean;
  };
}

// Define the author onboarding data type
interface AuthorOnboardingData {
  name: string;
  bio: string;
  books: AuthorBook[];
}

export class ProfileManager {
  private static supabase = createClient();

  /**
   * Get the complete profile data for an author, including their podcast preferences and books
   * @param authorId - The ID of the author
   * @returns Promise containing profile, books, and preferences data
   */
  static async getProfile(authorId: string): Promise<{
    profile: Author | null;
    preferences: PodcastPreferences | null;
    books: AuthorBook[] | null;
  }> {
    try {
      // Fetch profile, preferences, and books data in parallel
      const [profileResponse, preferencesResponse, booksResponse] =
        await Promise.all([
          // Get author profile data
          this.supabase.from('authors').select('*').eq('id', authorId).single(),

          // Get podcast preferences
          this.supabase
            .from('podcast_preferences')
            .select('*')
            .eq('author_id', authorId)
            .single(),

          // Get author's books
          this.supabase.from('books').select('*').eq('author_id', authorId)
        ]);

      // Return structured response
      return {
        profile: profileResponse.data,
        preferences: preferencesResponse.data,
        books: booksResponse.data
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        profile: null,
        preferences: null,
        books: null
      };
    }
  }

  /**
   * Update author's basic profile information
   * @param authorId - The ID of the author
   * @param profileData - The profile data to update
   */
  static async updateProfile(
    authorId: string,
    profileData: Partial<AuthorOnboardingData>
  ): Promise<void> {
    try {
      // 1. Update author profile
      if (profileData.name || profileData.bio) {
        const { error: profileError } = await this.supabase
          .from('authors')
          .update({
            name: profileData.name,
            bio: profileData.bio,
            updated_at: new Date().toISOString()
          })
          .eq('id', authorId);

        if (profileError) throw profileError;
      }

      // 2. Update books if provided
      if (profileData.books?.length) {
        const { error: booksError } = await this.supabase.from('books').upsert(
          profileData.books.map((book) => ({
            ...book,
            author_id: authorId,
            updated_at: new Date().toISOString()
          }))
        );

        if (booksError) throw booksError;
      }

      // 3. Invalidate cached analysis since profile changed
      await this.invalidateAnalysis(authorId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update author profile');
    }
  }

  /**
   * Update podcast preferences for an author
   * @param authorId - The ID of the author
   * @param preferences - Partial preferences to update
   */
  static async updatePodcastPreferences(
    authorId: string,
    preferences: Partial<PodcastPreferences>
  ): Promise<void> {
    try {
      // 1. Update preferences in the database
      const { error: updateError } = await this.supabase
        .from('podcast_preferences')
        .upsert({
          author_id: authorId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // 2. Invalidate cached analysis
      await this.invalidateAnalysis(authorId);
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update podcast preferences');
    }
  }

  /**
   * Invalidate the cached analysis for an author
   * @param authorId - The ID of the author
   */
  private static async invalidateAnalysis(authorId: string): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from('author_analysis')
      .delete()
      .eq('author_id', authorId);

    if (deleteError) {
      console.error('Error invalidating analysis:', deleteError);
    }

    // Trigger new analysis in the background
    AuthorAnalyzer.analyze(authorId).catch((error) => {
      console.error('Error running new analysis:', error);
    });
  }

  /**
   * Check if profile or preferences have been updated since last analysis
   * @param authorId - The ID of the author
   * @returns Boolean indicating if reanalysis is needed
   */
  static async needsReanalysis(authorId: string): Promise<boolean> {
    try {
      // Get all relevant timestamps
      const [analysisResponse, preferencesResponse, profileResponse] =
        await Promise.all([
          this.supabase
            .from('author_analysis')
            .select('analyzed_at')
            .eq('author_id', authorId)
            .single(),
          this.supabase
            .from('podcast_preferences')
            .select('updated_at')
            .eq('author_id', authorId)
            .single(),
          this.supabase
            .from('authors')
            .select('updated_at')
            .eq('id', authorId)
            .single()
        ]);

      if (!analysisResponse.data) {
        return true; // No analysis exists
      }

      const analysisDate = new Date(analysisResponse.data.analyzed_at);
      const preferencesDate = preferencesResponse.data?.updated_at
        ? new Date(preferencesResponse.data.updated_at)
        : new Date(0);
      const profileDate = profileResponse.data?.updated_at
        ? new Date(profileResponse.data.updated_at)
        : new Date(0);

      // Return true if either preferences or profile were updated after last analysis
      return preferencesDate > analysisDate || profileDate > analysisDate;
    } catch (error) {
      console.error('Error checking analysis status:', error);
      return true; // If in doubt, reanalyze
    }
  }
}

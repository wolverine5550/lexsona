import { OpenAI } from 'openai';
import {
  AuthorProfile,
  AuthorAnalysis,
  ExpertiseLevel,
  CommunicationStyle
} from '@/types/author';
import { createClient } from '@supabase/supabase-js';

/**
 * AuthorAnalyzer class handles the analysis of author profiles using AI
 * and manages caching of results for performance optimization
 */
export class AuthorAnalyzer {
  private static openai: OpenAI;
  private static supabase: any;

  private static getOpenAI() {
    if (!this.openai) {
      if (typeof window !== 'undefined') {
        throw new Error('OpenAI client cannot be used in browser');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.openai;
  }

  private static getSupabase() {
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    return this.supabase;
  }

  // Cache duration set to 7 days to balance freshness and API usage
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

  /**
   * Generates a structured prompt for OpenAI analysis
   * @param author - The author profile to analyze
   * @returns A formatted string prompt for AI analysis
   */
  private static async generateAnalysisPrompt(author: AuthorProfile): string {
    const supabase = this.getSupabase();

    // Get podcast preferences
    const { data: preferences } = await supabase
      .from('podcast_preferences')
      .select(
        `
        example_shows,
        interview_topics,
        target_audiences,
        preferred_episode_length,
        preferred_formats,
        content_restrictions,
        additional_notes,
        style_preferences
      `
      )
      .eq('author_id', author.id)
      .single();

    return `
      Please analyze this author's profile, work, and podcast preferences:
      
      Author Name: ${author.name}
      Bio: ${author.bio}
      
      Books:
      ${author.books
        .map(
          (book) => `
        Title: ${book.title}
        Description: ${book.description}
        Genre: ${book.genre.join(', ')}
        Target Audience: ${book.targetAudience.join(', ')}
      `
        )
        .join('\n')}
      
      Podcast Preferences:
      - Example Shows They Like: ${preferences?.example_shows?.join(', ') || 'Not specified'}
      - Preferred Interview Topics: ${preferences?.interview_topics?.join(', ') || 'Not specified'}
      - Target Audiences: ${preferences?.target_audiences?.join(', ') || 'Not specified'}
      - Preferred Episode Length: ${preferences?.preferred_episode_length || 'Not specified'}
      - Preferred Formats: ${preferences?.preferred_formats?.join(', ') || 'Not specified'}
      - Content Restrictions: ${preferences?.content_restrictions || 'None'}
      - Style Preferences: ${Object.entries(
        preferences?.style_preferences || {}
      )
        .filter(([_, value]) => value)
        .map(([key]) => key.replace('is', '').replace('Preferred', ''))
        .join(', ')}
      - Additional Notes: ${preferences?.additional_notes || 'None'}
      
      Please provide a structured analysis including:
      1. Main topics and themes (list up to 5)
      2. Expertise level (beginner/intermediate/expert)
      3. Communication style (casual/professional/academic/storyteller)
      4. Key talking points (list up to 5)
      5. Preferred podcast formats and styles
      6. Target audience alignment
      7. Content boundaries and restrictions
      
      Provide the response in JSON format.
    `;
  }

  /**
   * Performs AI analysis on an author profile using OpenAI
   * @param author - The author profile to analyze
   * @returns Promise<AuthorAnalysis> - The AI-generated analysis
   */
  private static async analyzeWithAI(
    author: AuthorProfile
  ): Promise<AuthorAnalysis> {
    const openai = this.getOpenAI();
    // Generate AI analysis of author's background
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: this.generateAnalysisPrompt(author)
        }
      ],
      temperature: 0.7
    });

    // Parse results into structured analysis
    const result = JSON.parse(response.choices[0].message?.content || '{}');

    return {
      authorId: author.id,
      topics: result.topics || [],
      expertiseLevel: result.expertiseLevel,
      communicationStyle: result.communicationStyle,
      keyPoints: result.keyPoints || [],
      confidence: result.confidence || 0.8
    };
  }

  /**
   * Main analysis method that handles caching and orchestrates the analysis process
   * @param authorId - The ID of the author to analyze
   * @returns Promise<AuthorAnalysis> - The analysis results
   * @throws Error if author is not found
   */
  static async analyze(authorId: string): Promise<AuthorAnalysis> {
    const openai = this.getOpenAI();
    const supabase = this.getSupabase();
    // Check cache first
    const { data: cachedAnalysis } = await supabase
      .from('author_analysis')
      .select('*')
      .eq('author_id', authorId)
      .single();

    if (
      cachedAnalysis &&
      new Date(cachedAnalysis.analyzed_at).getTime() >
        Date.now() - this.CACHE_DURATION
    ) {
      return this.formatCachedAnalysis(cachedAnalysis);
    }

    // Fetch author profile
    const { data: author } = await supabase
      .from('authors')
      .select('*, books(*)')
      .eq('id', authorId)
      .single();

    if (!author) {
      throw new Error('Author not found');
    }

    // Perform new analysis
    const analysis = await this.analyzeWithAI(author);

    // Cache the results
    await this.cacheAnalysis(authorId, analysis);

    return analysis;
  }

  /**
   * Caches analysis results in Supabase for future use
   * @param authorId - The ID of the author
   * @param analysis - The analysis results to cache
   */
  private static async cacheAnalysis(
    authorId: string,
    analysis: AuthorAnalysis
  ): Promise<void> {
    const supabase = this.getSupabase();
    await supabase.from('author_analysis').upsert({
      author_id: authorId,
      topics: analysis.topics,
      expertise_level: analysis.expertiseLevel.toLowerCase(),
      communication_style: analysis.communicationStyle.toLowerCase(),
      key_points: analysis.keyPoints,
      confidence: analysis.confidence,
      analyzed_at: new Date().toISOString()
    });
  }

  /**
   * Formats cached analysis data to match the AuthorAnalysis type
   * @param cachedData - Raw cached data from Supabase
   * @returns AuthorAnalysis - Formatted analysis data
   */
  private static formatCachedAnalysis(cachedData: any): AuthorAnalysis {
    return {
      authorId: cachedData.author_id,
      topics: cachedData.topics,
      expertiseLevel: cachedData.expertise_level,
      communicationStyle: cachedData.communication_style,
      keyPoints: cachedData.key_points,
      confidence: cachedData.confidence
    };
  }
}

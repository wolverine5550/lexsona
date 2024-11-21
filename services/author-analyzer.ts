import OpenAI from 'openai';
import {
  AuthorProfile,
  AuthorAnalysis,
  ExpertiseLevel,
  CommunicationStyle
} from '@/types/author';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class AuthorAnalyzer {
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  private static generateAnalysisPrompt(author: AuthorProfile): string {
    return `
      Please analyze this author's profile and their work:
      
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
      
      Please provide a structured analysis including:
      1. Main topics and themes (list up to 5)
      2. Expertise level (beginner/intermediate/expert)
      3. Communication style (casual/professional/academic/storyteller)
      4. Key talking points (list up to 5)
      
      Provide the response in JSON format.
    `;
  }

  private static async analyzeWithAI(
    author: AuthorProfile
  ): Promise<AuthorAnalysis> {
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

    const result = JSON.parse(response.choices[0].message?.content || '{}');

    return {
      topics: result.topics || [],
      expertiseLevel: result.expertiseLevel as ExpertiseLevel,
      communicationStyle: result.communicationStyle as CommunicationStyle,
      keyPoints: result.keyPoints || [],
      confidence: result.confidence || 0.8
    };
  }

  static async analyze(authorId: string): Promise<AuthorAnalysis> {
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

  private static async cacheAnalysis(
    authorId: string,
    analysis: AuthorAnalysis
  ): Promise<void> {
    await supabase.from('author_analysis').upsert({
      author_id: authorId,
      topics: analysis.topics,
      expertise_level: analysis.expertiseLevel,
      communication_style: analysis.communicationStyle,
      key_points: analysis.keyPoints,
      confidence: analysis.confidence,
      analyzed_at: new Date().toISOString()
    });
  }

  private static formatCachedAnalysis(cachedData: any): AuthorAnalysis {
    return {
      topics: cachedData.topics,
      expertiseLevel: cachedData.expertise_level,
      communicationStyle: cachedData.communication_style,
      keyPoints: cachedData.key_points,
      confidence: cachedData.confidence
    };
  }
}

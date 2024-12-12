import { OpenAI } from 'openai';
import {
  PodcastBase,
  PodcastAnalysis,
  EnhancedPodcast,
  HostStyle,
  AudienceLevel,
  TopicDepth
} from '@/types/podcast';
import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client for database operations
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Initialize OpenAI client for AI analysis
 */
export class PodcastAnalyzer {
  private static openai: OpenAI;

  private static getOpenAI() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });
    }
    return this.openai;
  }

  private static readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Generates a detailed prompt for OpenAI to analyze podcast content
   */
  private static generateAnalysisPrompt(podcast: PodcastBase): string {
    return `
      Please analyze this podcast's content and style:
      
      Title: ${podcast.title}
      Description: ${podcast.description}
      Publisher: ${podcast.publisher}
      Categories: ${podcast.categories.join(', ')}
      Average Episode Length: ${podcast.averageEpisodeLength} minutes
      Total Episodes: ${podcast.totalEpisodes}
      
      Please provide a structured analysis including:
      1. Host Style (conversational/interview/educational/debate/storytelling)
      2. Audience Level (beginner/intermediate/expert/mixed)
      3. Topic Depth (surface/moderate/deep/comprehensive)
      4. Guest Requirements:
         - Minimum expertise level
         - Preferred topics (up to 3)
         - Communication preferences
      5. Main topical focus areas (up to 5)
      
      Provide the response in JSON format.
    `;
  }

  /**
   * Performs AI analysis on a podcast using OpenAI
   */
  private static async analyzeWithAI(
    podcast: PodcastBase
  ): Promise<PodcastAnalysis> {
    const openai = this.getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: this.generateAnalysisPrompt(podcast)
        }
      ],
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message?.content || '{}');

    return {
      podcastId: podcast.id,
      hostStyle: result.hostStyle as HostStyle,
      audienceLevel: result.audienceLevel as AudienceLevel,
      topicDepth: result.topicDepth as TopicDepth,
      guestRequirements: {
        minimumExpertise: result.guestRequirements.minimumExpertise,
        preferredTopics: result.guestRequirements.preferredTopics || [],
        communicationPreference:
          result.guestRequirements.communicationPreference || []
      },
      topicalFocus: result.topicalFocus || [],
      confidence: result.confidence || 0.8,
      lastAnalyzed: new Date()
    };
  }

  /**
   * Main method to analyze a podcast and cache results
   */
  static async analyze(podcastId: string): Promise<EnhancedPodcast> {
    // Check cache first
    const cachedAnalysis = await checkCache(podcastId);
    if (cachedAnalysis) return cachedAnalysis;

    // Analyze podcast content and style
    const analysis = await this.analyzeWithAI(podcast);

    return {
      ...podcast,
      analysis: {
        hostStyle: analysis.hostStyle,
        audienceLevel: analysis.audienceLevel,
        topicDepth: analysis.topicDepth,
        guestRequirements: analysis.guestRequirements,
        topicalFocus: analysis.topicalFocus,
        confidence: analysis.confidence
      }
    };
  }

  /**
   * Caches podcast analysis results
   */
  private static async cacheAnalysis(analysis: PodcastAnalysis): Promise<void> {
    await supabase.from('podcast_analysis').upsert({
      podcast_id: analysis.podcastId,
      host_style: analysis.hostStyle,
      audience_level: analysis.audienceLevel,
      topic_depth: analysis.topicDepth,
      guest_requirements: analysis.guestRequirements,
      topical_focus: analysis.topicalFocus,
      confidence: analysis.confidence,
      last_analyzed: analysis.lastAnalyzed.toISOString()
    });
  }

  /**
   * Formats cached analysis data to match the EnhancedPodcast type
   */
  private static formatCachedAnalysis(cachedData: any): EnhancedPodcast {
    return {
      ...cachedData,
      analysis: {
        podcastId: cachedData.podcast_id,
        hostStyle: cachedData.host_style,
        audienceLevel: cachedData.audience_level,
        topicDepth: cachedData.topic_depth,
        guestRequirements: cachedData.guest_requirements,
        topicalFocus: cachedData.topical_focus,
        confidence: cachedData.confidence,
        lastAnalyzed: new Date(cachedData.last_analyzed)
      }
    };
  }
}

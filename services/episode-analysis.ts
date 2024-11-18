import { openaiClient } from '@/utils/openai';
import { createClient } from '@/utils/supabase/client';
import type { EpisodeAnalysis } from '@/types/podcast-analysis';
import { AnalysisError } from '@/types/podcast-analysis';

/**
 * Type for episode data from database
 */
interface EpisodeData {
  id: string;
  title: string;
  description: string;
  transcript?: string;
  published_at: string;
  episode_number: number;
}

/**
 * Type for parsed analysis response
 */
interface AnalysisResponse {
  topics: string[];
  keyPoints: string[];
  guestExperts?: string[];
  contentType: string[];
  confidence: number;
}

/**
 * Service for analyzing podcast episode content
 */
export class EpisodeAnalysisService {
  /**
   * Maximum number of episodes to analyze per podcast
   */
  private static readonly MAX_EPISODES = 5;

  /**
   * Minimum confidence score required for analysis
   */
  private static readonly MIN_CONFIDENCE = 70;

  /**
   * Analyzes multiple episodes for a podcast
   * @param podcastId - The podcast ID
   * @param episodeIds - Array of episode IDs to analyze
   * @returns Array of episode analyses
   */
  static async analyzeEpisodes(
    podcastId: string,
    episodeIds: string[]
  ): Promise<EpisodeAnalysis[]> {
    // Limit number of episodes
    const limitedEpisodes = episodeIds.slice(0, this.MAX_EPISODES);

    // Process episodes in parallel with rate limiting
    const analyses = await Promise.all(
      limitedEpisodes.map(async (episodeId) => {
        try {
          return await this.analyzeEpisode(podcastId, episodeId);
        } catch (error) {
          console.error(`Error analyzing episode ${episodeId}:`, error);
          return null;
        }
      })
    );

    // Filter out failed analyses
    return analyses.filter(
      (analysis): analysis is EpisodeAnalysis => analysis !== null
    );
  }

  /**
   * Analyzes a single episode's content
   * @param podcastId - The podcast ID
   * @param episodeId - The episode ID to analyze
   * @returns Episode analysis results
   */
  private static async analyzeEpisode(
    podcastId: string,
    episodeId: string
  ): Promise<EpisodeAnalysis> {
    const supabase = createClient();

    try {
      // Fetch episode content with proper typing
      const { data: episode, error } = await supabase
        .from('episodes')
        .select('title, description, transcript, published_at, episode_number')
        .eq('id', episodeId)
        .single<EpisodeData>();

      if (error || !episode) {
        throw new Error('Episode not found');
      }

      const prompt = this.createAnalysisPrompt(episode);
      const analysis = await openaiClient.processChatCompletion([
        { role: 'user', content: prompt }
      ]);

      const parsedAnalysis = this.parseAnalysisResponse(analysis);

      if (parsedAnalysis.confidence < this.MIN_CONFIDENCE) {
        throw new Error('Analysis confidence too low');
      }

      return {
        id: episodeId,
        podcastId,
        episodeNumber: episode.episode_number,
        topics: parsedAnalysis.topics,
        keyPoints: parsedAnalysis.keyPoints,
        guestExperts: parsedAnalysis.guestExperts,
        contentType: parsedAnalysis.contentType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new AnalysisError(
        'Failed to analyze episode',
        'PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Creates an analysis prompt for an episode
   */
  private static createAnalysisPrompt(episode: EpisodeData): string {
    return `Analyze this podcast episode:
      Title: ${episode.title}
      Description: ${episode.description}
      ${episode.transcript ? `Transcript: ${episode.transcript}` : ''}
      Published: ${episode.published_at}

      Please extract:
      1. Main topics discussed (comma-separated list)
      2. Key points and takeaways (bullet points)
      3. Guest experts mentioned (if any)
      4. Content type/format (interview, monologue, panel, etc.)
      5. Technical terms or jargon used

      Provide the analysis in JSON format with these fields:
      {
        "topics": string[],
        "keyPoints": string[],
        "guestExperts": string[],
        "contentType": string[],
        "confidence": number
      }`;
  }

  /**
   * Parses the OpenAI response into structured data
   */
  private static parseAnalysisResponse(response: string): AnalysisResponse {
    try {
      const parsed = JSON.parse(response);

      // Validate required fields
      if (!parsed.topics || !parsed.keyPoints || !parsed.contentType) {
        throw new Error('Missing required fields in analysis');
      }

      return parsed as AnalysisResponse;
    } catch (error) {
      throw new Error('Failed to parse analysis response');
    }
  }
}

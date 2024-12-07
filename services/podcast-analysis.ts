import { getOpenAIClient } from '@/utils/openai';
import { createClient } from '@/utils/supabase/client';
import type {
  PodcastAnalysis,
  PodcastFeatures,
  EpisodeAnalysis
} from '@/types/podcast-analysis';
import { AnalysisError } from '@/types/podcast-analysis';
import type { Podcast } from '@/types/podcast';

/**
 * Service for analyzing podcast content and extracting features
 */
export class PodcastAnalysisService {
  /**
   * Extracts key features from a podcast's metadata and recent episodes
   * @param podcast - The podcast to analyze
   * @returns Extracted features
   */
  static async extractFeatures(podcast: Podcast): Promise<PodcastFeatures> {
    try {
      // Prepare analysis prompt
      const prompt = `Analyze this podcast and extract key features:
        Title: ${podcast.title}
        Description: ${podcast.description}
        Publisher: ${podcast.publisher}
        Categories: ${podcast.categories.map((c) => c.name).join(', ')}
        
        Extract:
        1. Main topics
        2. Content style (interview, narrative, educational, debate)
        3. Complexity level
        4. Production quality
        5. Hosting style
        6. Language complexity`;

      // Get OpenAI analysis
      const analysis = await getOpenAIClient().processChatCompletion([
        { role: 'user', content: prompt }
      ]);

      // Parse and validate results
      const features = this.parseFeatures(analysis);

      return {
        ...features,
        id: podcast.id,
        averageEpisodeLength: podcast.total_episodes || 0,
        updateFrequency: this.calculateUpdateFrequency(podcast)
      };
    } catch (error) {
      console.error('Feature extraction error:', error);
      throw new AnalysisError(
        'Failed to extract podcast features',
        'EXTRACTION_ERROR',
        error
      );
    }
  }

  /**
   * Analyzes a specific podcast episode
   * @param podcastId - The podcast ID
   * @param episodeId - The episode ID
   * @returns Episode analysis
   */
  static async analyzeEpisode(
    podcastId: string,
    episodeId: string
  ): Promise<EpisodeAnalysis> {
    try {
      // Get episode content (implement episode fetching)
      const episode = await this.getEpisodeContent(episodeId);

      // Analyze content
      const prompt = `Analyze this podcast episode:
        ${episode.description}
        
        Extract:
        1. Main topics discussed
        2. Key points and takeaways
        3. Guest experts (if any)
        4. Content type/format`;

      const analysis = await getOpenAIClient().processChatCompletion([
        { role: 'user', content: prompt }
      ]);

      // Parse and structure results
      return this.parseEpisodeAnalysis(podcastId, episodeId, analysis);
    } catch (error) {
      console.error('Episode analysis error:', error);
      throw new AnalysisError(
        'Failed to analyze episode',
        'PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Stores analysis results in the database
   * @param analysis - The analysis results to store
   */
  static async storeAnalysis(analysis: PodcastAnalysis): Promise<void> {
    const supabase = createClient();

    try {
      // Store main analysis
      const { error: mainError } = await supabase
        .from('podcast_analysis')
        .upsert({
          podcast_id: analysis.podcastId,
          features: analysis.features,
          last_analyzed: analysis.lastAnalyzed,
          analysis_version: analysis.analysisVersion,
          confidence: analysis.confidence
        });

      if (mainError) throw mainError;

      // Store episode analyses
      const { error: episodeError } = await supabase
        .from('episode_analysis')
        .upsert(
          analysis.recentEpisodes.map((episode) => ({
            episode_id: episode.id,
            podcast_id: episode.podcastId,
            topics: episode.topics,
            key_points: episode.keyPoints,
            guest_experts: episode.guestExperts,
            content_type: episode.contentType,
            analyzed_at: episode.timestamp
          }))
        );

      if (episodeError) throw episodeError;
    } catch (error) {
      console.error('Analysis storage error:', error);
      throw new AnalysisError(
        'Failed to store analysis results',
        'STORAGE_ERROR',
        error
      );
    }
  }

  // Private helper methods
  private static parseFeatures(analysisText: any): PodcastFeatures {
    try {
      // Get the actual content from the OpenAI response
      const content = analysisText.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Invalid OpenAI response structure');
      }

      // Parse the JSON content
      const parsed = JSON.parse(content);

      return {
        id: '', // Will be overwritten
        mainTopics: parsed.mainTopics || [],
        contentStyle: {
          isInterview: parsed.contentStyle?.isInterview || false,
          isNarrative: parsed.contentStyle?.isNarrative || false,
          isEducational: parsed.contentStyle?.isEducational || false,
          isDebate: parsed.contentStyle?.isDebate || false
        },
        complexityLevel: parsed.complexityLevel || 'intermediate',
        averageEpisodeLength: 0, // Will be overwritten
        updateFrequency: 'weekly', // Will be overwritten
        productionQuality: parsed.productionQuality || 0,
        hostingStyle: parsed.hostingStyle || [],
        languageComplexity: parsed.languageComplexity || 0
      };
    } catch (error) {
      console.error('Failed to parse features:', error);
      throw new AnalysisError(
        'Failed to parse analysis response',
        'EXTRACTION_ERROR',
        error
      );
    }
  }

  private static parseEpisodeAnalysis(
    podcastId: string,
    episodeId: string,
    analysisText: string
  ): EpisodeAnalysis {
    // Implement parsing logic
    return {} as EpisodeAnalysis;
  }

  private static calculateUpdateFrequency(
    podcast: Podcast
  ): PodcastFeatures['updateFrequency'] {
    // Implement frequency calculation
    return 'weekly';
  }

  private static async getEpisodeContent(episodeId: string): Promise<any> {
    // Implement episode content fetching
    return {};
  }
}

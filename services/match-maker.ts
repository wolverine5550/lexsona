import { createClient } from '@/utils/supabase/client';
import {
  AuthorAnalysis,
  ExpertiseLevel,
  CommunicationStyle
} from '@/types/author';
import { PodcastAnalysis, HostStyle } from '@/types/podcast';
import { PodcastMatch, MatchFactors } from '@/types/matching';

const supabase = createClient();

export class MatchMaker {
  // Scoring weights for different factors
  private static readonly TOPIC_WEIGHT = 0.35;
  private static readonly EXPERTISE_WEIGHT = 0.4;
  private static readonly STYLE_WEIGHT = 0.25;

  // Style compatibility mapping
  private static readonly STYLE_COMPATIBILITY: Record<
    CommunicationStyle,
    HostStyle[]
  > = {
    [CommunicationStyle.Professional]: ['interview', 'educational', 'debate'],
    [CommunicationStyle.Casual]: ['conversational', 'storytelling'],
    [CommunicationStyle.Academic]: ['educational', 'debate'],
    [CommunicationStyle.Storyteller]: ['storytelling', 'conversational']
  };

  private static calculateTopicScore(
    authorTopics: string[],
    podcastTopics: (string | number)[]
  ): number {
    // Convert all topics to lowercase strings for comparison
    const normalizedAuthorTopics = authorTopics.map((topic) =>
      String(topic).toLowerCase()
    );
    const normalizedPodcastTopics = podcastTopics.map((topic) =>
      String(topic).toLowerCase()
    );

    const matchingTopics = normalizedAuthorTopics.filter((topic) =>
      normalizedPodcastTopics.some((podTopic) => podTopic.includes(topic))
    );

    return (
      matchingTopics.length /
      Math.max(
        1,
        Math.min(normalizedAuthorTopics.length, normalizedPodcastTopics.length)
      )
    );
  }

  private static calculateExpertiseScore(
    authorLevel: ExpertiseLevel,
    podcastLevel: string
  ): number {
    const levels = [
      ExpertiseLevel.Beginner,
      ExpertiseLevel.Intermediate,
      ExpertiseLevel.Expert
    ];
    const authorIdx = levels.indexOf(authorLevel);
    const podcastIdx = levels.indexOf(podcastLevel as ExpertiseLevel);

    // If podcast level is not specified, assume intermediate
    if (podcastIdx === -1) return 0.7;

    if (authorIdx >= podcastIdx) return 1.0;
    if (authorIdx === podcastIdx - 1) return 0.5;
    return 0.2;
  }

  private static calculateStyleScore(
    authorStyle: CommunicationStyle,
    podcastStyle: HostStyle
  ): number {
    const compatibleStyles = this.STYLE_COMPATIBILITY[authorStyle] || [];
    return compatibleStyles.includes(podcastStyle) ? 1.0 : 0.3;
  }

  private static generateExplanations(scores: {
    topicScore: number;
    expertiseScore: number;
    styleScore: number;
  }): string[] {
    const explanations: string[] = [];

    if (scores.topicScore > 0.7) {
      explanations.push('Strong topic alignment with podcast focus');
    } else if (scores.topicScore < 0.3) {
      explanations.push('Limited topic overlap with podcast content');
    }

    if (scores.expertiseScore > 0.8) {
      explanations.push('Expertise level matches podcast requirements');
    } else if (scores.expertiseScore < 0.5) {
      explanations.push('Expertise level may need development');
    }

    if (scores.styleScore > 0.7) {
      explanations.push('Communication style aligns well with podcast format');
    } else {
      explanations.push('Communication style may need adaptation');
    }

    return explanations;
  }

  public static async generateMatch(
    authorId: string,
    podcastId: string
  ): Promise<PodcastMatch> {
    console.log('Starting match generation:', { authorId, podcastId });

    // Get analyses for both author and podcast
    const [author, podcast] = await Promise.all([
      this.getAuthorAnalysis(authorId),
      this.getPodcastAnalysis(podcastId)
    ]);

    // Calculate individual scores
    const topicScore = this.calculateTopicScore(author.topics, podcast.topics);
    const expertiseScore = this.calculateExpertiseScore(
      author.expertiseLevel,
      podcast.audienceLevel
    );
    const styleScore = this.calculateStyleScore(
      author.communicationStyle,
      podcast.hostStyle as HostStyle
    );

    // Calculate overall match score
    const overallScore =
      topicScore * this.TOPIC_WEIGHT +
      expertiseScore * this.EXPERTISE_WEIGHT +
      styleScore * this.STYLE_WEIGHT;

    const matchFactors: MatchFactors = {
      topicScore,
      expertiseScore,
      styleScore,
      audienceScore: expertiseScore, // Use expertise score as audience score
      formatScore: styleScore, // Use style score as format score
      lengthScore: 1.0, // Default to 1.0 as we don't have length requirements yet
      complexityScore: expertiseScore, // Use expertise score as complexity score
      qualityScore: Math.min(author.confidence, podcast.confidence),
      explanation: this.generateExplanations({
        topicScore,
        expertiseScore,
        styleScore
      })
    };

    return {
      podcastId,
      overallScore,
      confidence: Math.min(author.confidence, podcast.confidence),
      breakdown: matchFactors,
      suggestedTopics: author.topics.filter((topic) => {
        const normalizedTopic = String(topic).toLowerCase();
        return podcast.topics.some((podTopic) =>
          String(podTopic).toLowerCase().includes(normalizedTopic)
        );
      }),
      podcast: {
        title: podcast.title,
        category: podcast.category,
        description: podcast.description,
        listeners: podcast.listeners,
        rating: podcast.rating,
        frequency: podcast.frequency
      }
    };
  }

  private static async getAuthorAnalysis(
    authorId: string
  ): Promise<AuthorAnalysis> {
    const { data, error } = await supabase
      .from('author_analysis')
      .select('*')
      .eq('author_id', authorId)
      .maybeSingle();

    // If no analysis exists yet, return default values
    if (!data) {
      return {
        authorId,
        topics: ['general'],
        expertiseLevel: ExpertiseLevel.Beginner,
        communicationStyle: CommunicationStyle.Casual,
        keyPoints: [],
        preferredFormats: ['interview'],
        targetAudience: ['general'],
        contentBoundaries: [],
        confidence: 0.7
      };
    }

    return {
      authorId: data.author_id,
      topics: data.topics || ['general'],
      expertiseLevel:
        (data.expertise_level as ExpertiseLevel) || ExpertiseLevel.Beginner,
      communicationStyle:
        (data.communication_style as CommunicationStyle) ||
        CommunicationStyle.Casual,
      keyPoints: data.key_points || [],
      preferredFormats: data.preferred_formats || ['interview'],
      targetAudience: data.target_audience || ['general'],
      contentBoundaries: data.content_boundaries || [],
      confidence: data.confidence || 0.7
    };
  }

  private static async getPodcastAnalysis(podcastId: string): Promise<
    PodcastAnalysis & {
      title: string;
      description: string;
      category: string;
      listeners: number;
      rating: number;
      frequency: string;
    }
  > {
    // First get the podcast details
    const { data: podcast, error: podcastError } = await supabase
      .from('podcasts')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (podcastError || !podcast) {
      throw new Error(
        `Podcast not found: ${podcastError?.message || 'Unknown error'}`
      );
    }

    // Then get the analysis if it exists
    const { data: analysis, error: analysisError } = await supabase
      .from('podcast_analysis')
      .select('*')
      .eq('podcast_id', podcastId)
      .maybeSingle();

    // If no analysis exists yet, use default values
    const defaultAnalysis = {
      hostStyle: 'interview' as HostStyle,
      audienceLevel: ExpertiseLevel.Intermediate,
      topics: podcast.categories || ['general'],
      confidence: 0.7
    };

    const finalAnalysis = analysis || defaultAnalysis;

    return {
      podcastId: podcast.id,
      hostStyle:
        (finalAnalysis.host_style as HostStyle) || defaultAnalysis.hostStyle,
      audienceLevel:
        (finalAnalysis.audience_level as ExpertiseLevel) ||
        defaultAnalysis.audienceLevel,
      topics: finalAnalysis.topics || defaultAnalysis.topics,
      confidence: finalAnalysis.confidence || defaultAnalysis.confidence,
      title: podcast.title,
      description: podcast.description,
      category: podcast.categories?.[0] || '',
      listeners: podcast.listen_score || 0,
      rating: podcast.listen_score ? podcast.listen_score / 20 : 0,
      frequency: 'weekly',
      lastAnalyzed: finalAnalysis.analyzed_at || new Date()
    };
  }
}

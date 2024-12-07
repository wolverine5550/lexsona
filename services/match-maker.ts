import { createClient } from '@/utils/supabase/client';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { PodcastMatch, MatchFactors } from '@/types/matching';
import { CommunicationStyle } from '@/types/author';
import { HostStyle } from '@/types/podcast';

const supabase = createClient();

export class MatchMaker {
  // Scoring weights
  private static readonly TOPIC_WEIGHT = 0.35;
  private static readonly EXPERTISE_WEIGHT = 0.4;
  private static readonly STYLE_WEIGHT = 0.25;

  // Style compatibility mapping
  private static readonly STYLE_COMPATIBILITY: Record<
    CommunicationStyle,
    HostStyle[]
  > = {
    professional: ['interview', 'educational', 'debate'],
    casual: ['conversational', 'storytelling'],
    academic: ['educational', 'debate'],
    storyteller: ['storytelling', 'conversational']
  };

  private static calculateTopicScore(
    authorTopics: string[],
    podcastTopics: string[]
  ): number {
    const matchingTopics = authorTopics.filter((topic) =>
      podcastTopics.some((podTopic) =>
        podTopic.toLowerCase().includes(topic.toLowerCase())
      )
    );
    return (
      matchingTopics.length /
      Math.max(1, Math.min(authorTopics.length, podcastTopics.length))
    );
  }

  private static calculateExpertiseScore(
    authorLevel: string,
    requiredLevel: string
  ): number {
    const levels = ['beginner', 'intermediate', 'expert'];
    const authorIdx = levels.indexOf(authorLevel);
    const requiredIdx = levels.indexOf(requiredLevel);

    if (authorIdx >= requiredIdx) return 1.0;
    if (authorIdx === requiredIdx - 1) return 0.3;
    return 0.1;
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
      explanations.push('Expertise level may be insufficient');
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
    const [author, podcast] = await Promise.all([
      this.getAuthorAnalysis(authorId),
      this.getPodcastAnalysis(podcastId)
    ]);

    // Calculate scores first
    const topicScore = this.calculateTopicScore(
      author.topics,
      podcast.topicalFocus
    );
    const expertiseScore = this.calculateExpertiseScore(
      author.expertiseLevel,
      podcast.guestRequirements.minimumExpertise
    );
    const styleScore = this.calculateStyleScore(
      author.communicationStyle as CommunicationStyle,
      podcast.hostStyle
    );

    // Generate explanations based on calculated scores
    const explanations = this.generateExplanations({
      topicScore,
      expertiseScore,
      styleScore
    });

    const breakdown: MatchFactors = {
      topicScore,
      expertiseScore,
      styleScore,
      audienceScore: 0.8,
      formatScore: 0.8,
      lengthScore: 0.8,
      complexityScore: 0.8,
      qualityScore: 0.8,
      explanation: explanations
    };

    const overallScore =
      breakdown.topicScore * this.TOPIC_WEIGHT +
      breakdown.expertiseScore * this.EXPERTISE_WEIGHT +
      breakdown.styleScore * this.STYLE_WEIGHT;

    return {
      podcastId,
      overallScore,
      confidence: Math.min(author.confidence, podcast.confidence),
      breakdown,
      suggestedTopics: author.topics.filter((topic) =>
        podcast.topicalFocus.includes(topic)
      )
    };
  }

  private static async getAuthorAnalysis(
    authorId: string
  ): Promise<AuthorAnalysis> {
    const { data, error } = await supabase
      .from('author_analysis')
      .select('*')
      .eq('id', authorId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Author analysis not found');
    return data;
  }

  private static async getPodcastAnalysis(
    podcastId: string
  ): Promise<PodcastAnalysis> {
    const { data, error } = await supabase
      .from('podcast_analysis')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Podcast analysis not found');
    return data;
  }
}

import {
  MatchWeights,
  MatchScoreBreakdown,
  MatchResult,
  MatchConfig
} from '@/types/matching';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Service for matching authors with podcasts based on multiple criteria
 */
export class MatchMaker {
  // Default weights for matching criteria
  private static readonly DEFAULT_WEIGHTS: MatchWeights = {
    topicRelevance: 0.35,
    expertiseAlignment: 0.25,
    communicationStyle: 0.15,
    audienceMatch: 0.15,
    formatSuitability: 0.1
  };

  // Minimum thresholds
  private static readonly DEFAULT_CONFIG: MatchConfig = {
    weights: MatchMaker.DEFAULT_WEIGHTS,
    minimumScore: 0.6,
    minimumConfidence: 0.7
  };

  /**
   * Calculates topic relevance score between author and podcast
   */
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
      Math.max(authorTopics.length, podcastTopics.length)
    );
  }

  /**
   * Calculates expertise level alignment
   */
  private static calculateExpertiseScore(
    authorLevel: string,
    podcastLevel: string
  ): number {
    const levels = ['beginner', 'intermediate', 'expert'];
    const authorIdx = levels.indexOf(authorLevel);
    const podcastIdx = levels.indexOf(podcastLevel);

    // Perfect match or podcast level is lower
    if (authorIdx >= podcastIdx) {
      return 1.0;
    }

    // Author's expertise is too low
    return 0.5;
  }

  /**
   * Calculates communication style compatibility
   */
  private static calculateStyleScore(
    authorStyle: string,
    podcastStyle: string
  ): number {
    const styleCompatibility: { [key: string]: string[] } = {
      casual: ['conversational', 'storytelling'],
      professional: ['interview', 'educational', 'debate'],
      academic: ['educational', 'debate'],
      storyteller: ['storytelling', 'conversational']
    };

    return styleCompatibility[authorStyle]?.includes(podcastStyle) ? 1.0 : 0.5;
  }

  /**
   * Generates a detailed match result between an author and podcast
   */
  static async generateMatch(
    authorId: string,
    podcastId: string,
    config: MatchConfig = MatchMaker.DEFAULT_CONFIG
  ): Promise<MatchResult> {
    // Fetch analyses
    const [authorAnalysis, podcastAnalysis] = await Promise.all([
      this.getAuthorAnalysis(authorId),
      this.getPodcastAnalysis(podcastId)
    ]);

    // Calculate individual scores
    const topicScore = this.calculateTopicScore(
      authorAnalysis.topics,
      podcastAnalysis.topicalFocus
    );

    const expertiseScore = this.calculateExpertiseScore(
      authorAnalysis.expertiseLevel,
      podcastAnalysis.guestRequirements.minimumExpertise
    );

    const styleScore = this.calculateStyleScore(
      authorAnalysis.communicationStyle,
      podcastAnalysis.hostStyle
    );

    const audienceScore = this.calculateAudienceAlignment(
      authorAnalysis,
      podcastAnalysis
    );

    const formatScore = this.calculateFormatSuitability(
      authorAnalysis,
      podcastAnalysis
    );

    // Calculate weighted overall score
    const overallScore =
      topicScore * config.weights.topicRelevance +
      expertiseScore * config.weights.expertiseAlignment +
      styleScore * config.weights.communicationStyle +
      audienceScore * config.weights.audienceMatch +
      formatScore * config.weights.formatSuitability;

    // Calculate confidence based on individual analysis confidences
    const confidence = Math.min(
      authorAnalysis.confidence,
      podcastAnalysis.confidence
    );

    const breakdown: MatchScoreBreakdown = {
      topicScore,
      expertiseScore,
      styleScore,
      audienceScore,
      formatScore,
      explanation: this.generateExplanation({
        topicScore,
        expertiseScore,
        styleScore,
        audienceScore,
        formatScore
      })
    };

    return {
      authorId,
      podcastId,
      overallScore,
      confidence,
      breakdown,
      suggestedTopics: this.generateSuggestedTopics(
        authorAnalysis,
        podcastAnalysis
      )
    };
  }

  // Helper methods implementation...
  private static async getAuthorAnalysis(
    authorId: string
  ): Promise<AuthorAnalysis> {
    const { data } = await supabase
      .from('author_analysis')
      .select('*')
      .eq('id', authorId)
      .single();

    if (!data) throw new Error('Author analysis not found');
    return data;
  }

  private static async getPodcastAnalysis(
    podcastId: string
  ): Promise<PodcastAnalysis> {
    const { data } = await supabase
      .from('podcast_analysis')
      .select('*')
      .eq('id', podcastId)
      .single();

    if (!data) throw new Error('Podcast analysis not found');
    return data;
  }

  /**
   * Calculates how well the author's content aligns with the podcast's audience
   */
  private static calculateAudienceAlignment(
    author: AuthorAnalysis,
    podcast: PodcastAnalysis
  ): number {
    // Check if author's expertise matches or exceeds podcast's audience level
    const audienceLevels = ['beginner', 'intermediate', 'expert', 'mixed'];
    const authorLevel = audienceLevels.indexOf(author.expertiseLevel);
    const podcastLevel = audienceLevels.indexOf(podcast.audienceLevel);

    if (podcast.audienceLevel === 'mixed') {
      return 1.0;
    }

    if (authorLevel >= podcastLevel) {
      return 1.0;
    }

    // Partial match if author is one level below
    if (authorLevel === podcastLevel - 1) {
      return 0.5;
    }

    return 0.2;
  }

  /**
   * Evaluates how well the author fits the podcast's format requirements
   */
  private static calculateFormatSuitability(
    author: AuthorAnalysis,
    podcast: PodcastAnalysis
  ): number {
    // Check communication style compatibility
    const styleMatch = this.calculateStyleScore(
      author.communicationStyle,
      podcast.hostStyle
    );

    // Check if author's topics align with podcast's guest requirements
    const topicMatch = author.topics.some((topic) =>
      podcast.guestRequirements.preferredTopics.includes(topic)
    );

    // Weight both factors
    return styleMatch * 0.6 + (topicMatch ? 0.4 : 0);
  }

  /**
   * Generates explanations for the match scores
   */
  private static generateExplanation(
    scores: Partial<MatchScoreBreakdown>
  ): string[] {
    const explanations: string[] = [];

    if (scores.topicScore !== undefined) {
      if (scores.topicScore > 0.8) {
        explanations.push('Strong topic alignment with podcast focus');
      } else if (scores.topicScore > 0.4) {
        explanations.push('Moderate topic overlap with podcast content');
      } else {
        explanations.push('Limited topic relevance to podcast');
      }
    }

    if (scores.expertiseScore !== undefined) {
      if (scores.expertiseScore > 0.8) {
        explanations.push('Expertise level matches podcast requirements');
      } else if (scores.expertiseScore > 0.4) {
        explanations.push('Expertise level partially meets requirements');
      } else {
        explanations.push('Expertise level may be insufficient');
      }
    }

    if (scores.styleScore !== undefined) {
      if (scores.styleScore > 0.8) {
        explanations.push(
          'Communication style aligns well with podcast format'
        );
      } else {
        explanations.push('Communication style may need adaptation');
      }
    }

    if (scores.audienceScore !== undefined) {
      if (scores.audienceScore > 0.8) {
        explanations.push('Well-suited for podcast audience level');
      } else {
        explanations.push('May need to adjust content for audience level');
      }
    }

    return explanations;
  }

  /**
   * Identifies potential talking points based on overlapping interests
   */
  private static generateSuggestedTopics(
    author: AuthorAnalysis,
    podcast: PodcastAnalysis
  ): string[] {
    // Find overlapping topics
    const commonTopics = author.topics.filter((topic) =>
      podcast.topicalFocus.some((podTopic) =>
        podTopic.toLowerCase().includes(topic.toLowerCase())
      )
    );

    // Add author's key points that align with podcast topics
    const relevantKeyPoints = author.keyPoints.filter((point) =>
      podcast.topicalFocus.some((topic) =>
        point.toLowerCase().includes(topic.toLowerCase())
      )
    );

    // Combine, remove duplicates, and limit to top 5 suggestions
    return Array.from(
      commonTopics.concat(relevantKeyPoints).reduce((unique, item) => {
        if (!unique.includes(item)) {
          unique.push(item);
        }
        return unique;
      }, [] as string[])
    ).slice(0, 5);
  }
}

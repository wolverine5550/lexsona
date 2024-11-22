import OpenAI from 'openai';
import {
  DetailedMatchResult,
  EpisodeIdea,
  TopicExplanation,
  MatchResultMetadata
} from '@/types/match-results';
import { MatchResult } from '@/types/matching';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Service for processing and enriching match results with detailed analysis
 */
export class MatchResultsProcessor {
  // Results are considered fresh for 30 days
  private static readonly RESULTS_VALIDITY_PERIOD = 30 * 24 * 60 * 60 * 1000;

  /**
   * Processes a match result to generate detailed insights and recommendations
   */
  static async processMatch(
    matchResult: MatchResult,
    authorAnalysis: AuthorAnalysis,
    podcastAnalysis: PodcastAnalysis
  ): Promise<DetailedMatchResult> {
    const startTime = Date.now();

    // Generate unique match ID
    const matchId = `match_${matchResult.authorId}_${matchResult.podcastId}`;

    try {
      // Generate detailed components in parallel
      const [topicExplanations, episodeIdeas, detailedExplanations] =
        await Promise.all([
          this.generateTopicExplanations(authorAnalysis, podcastAnalysis),
          this.generateEpisodeIdeas(authorAnalysis, podcastAnalysis),
          this.generateDetailedExplanations(
            matchResult,
            authorAnalysis,
            podcastAnalysis
          )
        ]);

      const detailedResult: DetailedMatchResult = {
        matchId,
        authorId: matchResult.authorId,
        podcastId: matchResult.podcastId,
        overallScore: matchResult.overallScore,
        confidence: matchResult.confidence,

        compatibility: {
          topicAlignment: matchResult.breakdown.topicScore,
          expertiseMatch: matchResult.breakdown.expertiseScore,
          styleCompatibility: matchResult.breakdown.styleScore,
          audienceMatch: matchResult.breakdown.audienceScore,
          formatSuitability: matchResult.breakdown.formatScore
        },

        explanations: detailedExplanations,
        suggestedTopics: topicExplanations,
        potentialEpisodes: episodeIdeas,

        generatedAt: new Date(),
        validUntil: new Date(Date.now() + this.RESULTS_VALIDITY_PERIOD)
      };

      // Cache the results
      await this.cacheMatchResult(detailedResult);

      return detailedResult;
    } catch (error) {
      console.error('Error processing match result:', error);
      throw new Error('Failed to process match result');
    }
  }

  /**
   * Generates detailed explanations for topic suggestions
   */
  private static async generateTopicExplanations(
    author: AuthorAnalysis,
    podcast: PodcastAnalysis
  ): Promise<TopicExplanation[]> {
    const prompt = `
      Analyze the compatibility between author's expertise and podcast topics:

      Author's Topics: ${author.topics.join(', ')}
      Author's Key Points: ${author.keyPoints.join(', ')}
      Author's Expertise Level: ${author.expertiseLevel}

      Podcast Topics: ${podcast.topicalFocus.join(', ')}
      Podcast Audience Level: ${podcast.audienceLevel}
      Guest Requirements: ${podcast.guestRequirements.preferredTopics.join(', ')}

      For each overlapping topic, provide:
      1. Relevance score (0-1)
      2. Author's expertise level in the topic (0-1)
      3. Expected audience interest (0-1)
      4. Brief explanation of why this topic would work well

      Format as JSON array.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const suggestions = JSON.parse(
      response.choices[0].message?.content || '[]'
    );

    // Process and validate each suggestion
    return suggestions
      .map((suggestion: any) => ({
        topic: suggestion.topic,
        relevance: Math.min(1, Math.max(0, suggestion.relevance)),
        authorExpertise: Math.min(1, Math.max(0, suggestion.authorExpertise)),
        audienceInterest: Math.min(1, Math.max(0, suggestion.audienceInterest)),
        explanation: suggestion.explanation
      }))
      .slice(0, 5); // Limit to top 5 topics
  }

  /**
   * Generates potential episode ideas based on author and podcast analysis
   */
  private static async generateEpisodeIdeas(
    author: AuthorAnalysis,
    podcast: PodcastAnalysis
  ): Promise<EpisodeIdea[]> {
    const prompt = `
      Generate creative episode ideas based on:

      Author Background:
      - Topics: ${author.topics.join(', ')}
      - Key Points: ${author.keyPoints.join(', ')}
      - Expertise: ${author.expertiseLevel}
      - Style: ${author.communicationStyle}

      Podcast Context:
      - Style: ${podcast.hostStyle}
      - Audience: ${podcast.audienceLevel}
      - Topics: ${podcast.topicalFocus.join(', ')}

      Generate 3 unique episode ideas, each with:
      1. Catchy title
      2. Brief description
      3. 3-4 key talking points
      4. Target audience segments
      5. Relevance score (0-1)

      Format as JSON array.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8 // Slightly higher for more creative suggestions
    });

    const ideas = JSON.parse(response.choices[0].message?.content || '[]');

    // Process and validate each idea
    return ideas.map((idea: any) => ({
      title: idea.title,
      description: idea.description,
      keyPoints: idea.keyPoints || [],
      relevanceScore: Math.min(1, Math.max(0, idea.relevanceScore)),
      targetAudience: idea.targetAudience || []
    }));
  }

  /**
   * Generates detailed explanations for the match
   */
  private static async generateDetailedExplanations(
    matchResult: MatchResult,
    author: AuthorAnalysis,
    podcast: PodcastAnalysis
  ): Promise<{
    strengths: string[];
    considerations: string[];
    recommendations: string[];
  }> {
    const prompt = `
      Analyze this podcast match and provide detailed insights:

      Match Scores:
      - Overall: ${matchResult.overallScore}
      - Topic Alignment: ${matchResult.breakdown.topicScore}
      - Expertise Match: ${matchResult.breakdown.expertiseScore}
      - Style Compatibility: ${matchResult.breakdown.styleScore}

      Author Profile:
      - Expertise: ${author.expertiseLevel}
      - Style: ${author.communicationStyle}
      - Topics: ${author.topics.join(', ')}

      Podcast Profile:
      - Style: ${podcast.hostStyle}
      - Audience: ${podcast.audienceLevel}
      - Topics: ${podcast.topicalFocus.join(', ')}

      Provide:
      1. Key strengths of this match (3-4 points)
      2. Important considerations or potential challenges (2-3 points)
      3. Specific recommendations for success (3-4 points)

      Format as JSON with arrays for strengths, considerations, and recommendations.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const analysis = JSON.parse(response.choices[0].message?.content || '{}');

    return {
      strengths: analysis.strengths || [],
      considerations: analysis.considerations || [],
      recommendations: analysis.recommendations || []
    };
  }

  /**
   * Caches the detailed match result
   */
  private static async cacheMatchResult(
    result: DetailedMatchResult
  ): Promise<void> {
    await supabase.from('match_results').upsert({
      match_id: result.matchId,
      author_id: result.authorId,
      podcast_id: result.podcastId,
      result_data: result,
      generated_at: result.generatedAt.toISOString(),
      valid_until: result.validUntil.toISOString()
    });
  }
}

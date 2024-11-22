import { AuthorProfile } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { MatchResult } from '@/types/matching';

/**
 * Test data generators and utilities
 */
export class TestHelpers {
  /**
   * Generates mock author profile for testing
   */
  static createMockAuthor(overrides = {}): AuthorProfile {
    return {
      id: 'test-author',
      userId: 'user123',
      name: 'Test Author',
      bio: 'Test bio',
      expertise: 'expert',
      communicationStyle: 'professional',
      books: [
        {
          id: 'book123',
          title: 'Test Book',
          description: 'Test Description',
          genre: ['Technology'],
          targetAudience: ['Professionals'],
          publishDate: new Date(),
          keywords: ['test']
        }
      ],
      topics: ['technology'],
      keyPoints: ['key point 1'],
      ...overrides
    };
  }

  /**
   * Generates mock podcast analysis for testing
   */
  static createMockPodcastAnalysis(overrides = {}): PodcastAnalysis {
    return {
      podcastId: 'test-pod',
      hostStyle: 'interview',
      audienceLevel: 'expert',
      topicDepth: 'deep',
      guestRequirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['technology'],
        communicationPreference: ['professional']
      },
      topicalFocus: ['technology'],
      confidence: 0.9,
      lastAnalyzed: new Date(),
      ...overrides
    };
  }

  /**
   * Generates mock match result for testing
   */
  static createMockMatchResult(overrides = {}): MatchResult {
    return {
      authorId: 'test-author',
      podcastId: 'test-pod',
      overallScore: 0.85,
      confidence: 0.9,
      breakdown: {
        topicScore: 0.8,
        expertiseScore: 0.9,
        styleScore: 0.85,
        audienceScore: 0.9,
        formatScore: 0.8,
        explanation: ['Good match']
      },
      suggestedTopics: ['technology'],
      ...overrides
    };
  }

  /**
   * Simulates processing delay for performance testing
   */
  static async simulateProcessingDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

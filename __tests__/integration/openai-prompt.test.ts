import { describe, it, expect, beforeEach } from 'vitest';
import { openaiClient } from '@/utils/openai';
import { generatePrompt } from '@/utils/prompt-templates';
import type { PromptVariables } from '@/types/prompt';

describe('OpenAI Prompt Integration', () => {
  // Sample preferences that should yield consistent results
  const testVariables: PromptVariables = {
    topics: ['technology', 'science'],
    preferredLength: 'medium',
    stylePreferences: {
      isInterviewPreferred: true,
      isStorytellingPreferred: false,
      isEducationalPreferred: true,
      isDebatePreferred: false
    }
  };

  /**
   * Helper to validate OpenAI response structure
   */
  const isValidResponse = (response: any): boolean => {
    try {
      const parsed = JSON.parse(response);
      return (
        Array.isArray(parsed.matches) &&
        parsed.matches.every(
          (match: any) =>
            typeof match.relevanceScore === 'number' &&
            Array.isArray(match.topicMatch) &&
            Array.isArray(match.styleMatch) &&
            typeof match.matchReason === 'string'
        )
      );
    } catch {
      return false;
    }
  };

  it('should generate valid JSON responses', async () => {
    // Generate prompt
    const prompt = generatePrompt(testVariables);

    // Send to OpenAI
    const response = await openaiClient.processChatCompletion([
      { role: 'user', content: prompt }
    ]);

    // Verify response format
    expect(isValidResponse(response)).toBe(true);

    // Parse and verify content
    const parsed = JSON.parse(response);
    expect(parsed.matches.length).toBeGreaterThan(0);

    // Check first match
    const firstMatch = parsed.matches[0];
    expect(firstMatch.relevanceScore).toBeGreaterThanOrEqual(0);
    expect(firstMatch.relevanceScore).toBeLessThanOrEqual(100);
    expect(firstMatch.topicMatch).toContain('technology');
  }, 10000); // Increased timeout for API call

  it('should handle different topic combinations', async () => {
    const variations = [
      ['business', 'technology'],
      ['health', 'science'],
      ['education', 'culture']
    ];

    for (const topics of variations) {
      const prompt = generatePrompt({
        ...testVariables,
        topics
      });

      const response = await openaiClient.processChatCompletion([
        { role: 'user', content: prompt }
      ]);

      expect(isValidResponse(response)).toBe(true);

      // Verify topic relevance
      const parsed = JSON.parse(response);
      const matches = parsed.matches;
      expect(
        matches.some((match: any) =>
          match.topicMatch.some((topic: string) =>
            topics.includes(topic.toLowerCase())
          )
        )
      ).toBe(true);
    }
  }, 30000);

  it('should respect style preferences', async () => {
    const prompt = generatePrompt({
      ...testVariables,
      stylePreferences: {
        isInterviewPreferred: true,
        isStorytellingPreferred: false,
        isEducationalPreferred: false,
        isDebatePreferred: false
      }
    });

    const response = await openaiClient.processChatCompletion([
      { role: 'user', content: prompt }
    ]);

    const parsed = JSON.parse(response);

    // Check if matches reflect style preference
    parsed.matches.forEach((match: any) => {
      expect(match.styleMatch).toContain('interview');
    });
  }, 10000);

  it('should handle errors gracefully', async () => {
    // Test with invalid prompt
    const invalidPrompt = 'Invalid prompt without structure';

    await expect(
      openaiClient.processChatCompletion([
        { role: 'user', content: invalidPrompt }
      ])
    ).rejects.toThrow();
  });

  it('should maintain response quality across calls', async () => {
    // Make multiple calls and verify consistency
    const results = await Promise.all(
      Array(3)
        .fill(null)
        .map(async () => {
          const prompt = generatePrompt(testVariables);
          const response = await openaiClient.processChatCompletion([
            { role: 'user', content: prompt }
          ]);
          return JSON.parse(response);
        })
    );

    // Compare relevance scores across results
    const scores = results.map((r) => r.matches[0].relevanceScore);

    // Verify score consistency
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = Math.max(...scores) - Math.min(...scores);

    expect(variance).toBeLessThan(30); // Max allowed variance
    expect(avgScore).toBeGreaterThan(50); // Minimum quality threshold
  }, 30000);
});

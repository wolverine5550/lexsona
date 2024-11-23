import { MatchMaker } from '@/services/match-maker';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock the Supabase client module
vi.mock('@/utils/supabase/client', () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }));

  return {
    createClient: vi.fn(() => ({
      from: mockFrom
    }))
  };
});

// Import after mocking
import { createClient } from '@/utils/supabase/client';

describe('MatchMaker', () => {
  const mockAuthorAnalysis: AuthorAnalysis = {
    topics: ['technology', 'entrepreneurship', 'innovation'],
    expertiseLevel: 'expert',
    communicationStyle: 'professional',
    keyPoints: ['digital transformation', 'startup growth', 'tech trends'],
    confidence: 0.9
  };

  const mockPodcastAnalysis: PodcastAnalysis = {
    podcastId: 'pod123',
    hostStyle: 'interview',
    audienceLevel: 'expert',
    topicDepth: 'deep',
    guestRequirements: {
      minimumExpertise: 'expert',
      preferredTopics: ['technology', 'entrepreneurship', 'innovation'],
      communicationPreference: ['professional', 'clear']
    },
    topicalFocus: ['technology', 'entrepreneurship', 'innovation'],
    confidence: 0.85,
    lastAnalyzed: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset Supabase mock for each test
    const mockSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: mockAuthorAnalysis, error: null })
      .mockResolvedValueOnce({ data: mockPodcastAnalysis, error: null });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle
      })
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect
    });

    // Update the mock implementation
    const mockClient = createClient();
    vi.mocked(mockClient.from).mockImplementation(mockFrom);
  });

  it('should generate a high-quality match for well-aligned profiles', async () => {
    const result = await MatchMaker.generateMatch('author123', 'pod123');

    expect(result.overallScore).toBeGreaterThan(0.7);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.breakdown.topicScore).toBeGreaterThan(0.6);
    expect(result.breakdown.expertiseScore).toBe(1.0);
    expect(result.breakdown.styleScore).toBeGreaterThan(0.7);
    expect(result.suggestedTopics).toContain('technology');
  });

  it('should generate appropriate explanations for match scores', async () => {
    const result = await MatchMaker.generateMatch('author123', 'pod123');

    expect(result.breakdown.explanation).toContain(
      'Strong topic alignment with podcast focus'
    );
    expect(result.breakdown.explanation).toContain(
      'Expertise level matches podcast requirements'
    );
    expect(result.breakdown.explanation).toContain(
      'Communication style aligns well with podcast format'
    );
  });

  it('should handle mismatched expertise levels appropriately', async () => {
    const beginnerAuthorAnalysis = {
      ...mockAuthorAnalysis,
      expertiseLevel: 'beginner'
    };

    // Override the default mock for this test
    const mockSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: beginnerAuthorAnalysis, error: null })
      .mockResolvedValueOnce({ data: mockPodcastAnalysis, error: null });

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle
      })
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect
    });

    // Update the mock implementation
    vi.mocked(createClient().from).mockImplementation(mockFrom);

    const result = await MatchMaker.generateMatch('author123', 'pod123');

    expect(result.overallScore).toBeLessThan(0.7);
    expect(result.breakdown.expertiseScore).toBeLessThan(0.3);
    expect(result.breakdown.explanation).toContain(
      'Expertise level may be insufficient'
    );
  });

  it('should handle errors gracefully', async () => {
    // Override the default mock for this test
    const mockSingle = vi.fn().mockRejectedValue(new Error('Database error'));

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle
      })
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect
    });

    // Update the mock implementation
    vi.mocked(createClient().from).mockImplementation(mockFrom);

    await expect(
      MatchMaker.generateMatch('author123', 'pod123')
    ).rejects.toThrow('Database error');
  });
});

import { MatchMaker } from '@/services/match-maker';
import { AuthorAnalysis } from '@/types/author';
import { PodcastAnalysis } from '@/types/podcast';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn()
  }))
}));

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
      preferredTopics: ['technology', 'business', 'innovation'],
      communicationPreference: ['professional', 'clear']
    },
    topicalFocus: ['technology', 'startups', 'digital innovation'],
    confidence: 0.85,
    lastAnalyzed: new Date()
  };

  const supabase = createClient('mock-url', 'mock-key');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a high-quality match for well-aligned profiles', async () => {
    // Mock database responses
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockAuthorAnalysis })
            .mockResolvedValueOnce({ data: mockPodcastAnalysis })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const result = await MatchMaker.generateMatch('author123', 'pod123');

    expect(result.overallScore).toBeGreaterThan(0.8);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.breakdown.topicScore).toBeGreaterThan(0.7);
    expect(result.breakdown.expertiseScore).toBe(1.0);
    expect(result.breakdown.styleScore).toBeGreaterThan(0.8);
    expect(result.suggestedTopics).toContain('technology');
  });

  it('should generate appropriate explanations for match scores', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: mockAuthorAnalysis })
            .mockResolvedValueOnce({ data: mockPodcastAnalysis })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

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

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockResolvedValueOnce({ data: beginnerAuthorAnalysis })
            .mockResolvedValueOnce({ data: mockPodcastAnalysis })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const result = await MatchMaker.generateMatch('author123', 'pod123');

    expect(result.overallScore).toBeLessThan(0.6);
    expect(result.breakdown.expertiseScore).toBeLessThan(0.5);
    expect(result.breakdown.explanation).toContain(
      'Expertise level may be insufficient'
    );
  });

  it('should handle errors gracefully', async () => {
    // Mock database error
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    await expect(
      MatchMaker.generateMatch('author123', 'pod123')
    ).rejects.toThrow('Database error');
  });
});

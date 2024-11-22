import { CompatibilityService } from '@/services/compatibility-service';
import { MatchMaker } from '@/services/match-maker';
import { BatchProcessConfig, MatchFilter } from '@/types/compatibility';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn()
  }))
}));

// Mock MatchMaker
vi.mock('@/services/match-maker', () => ({
  MatchMaker: {
    generateMatch: vi.fn()
  }
}));

describe('CompatibilityService', () => {
  const mockPodcastIds = ['pod1', 'pod2', 'pod3'];
  const mockConfig: BatchProcessConfig = {
    maxConcurrent: 2,
    minMatchScore: 0.7,
    minConfidence: 0.8,
    maxResults: 2
  };

  const supabase = createClient('mock-url', 'mock-key');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process matches in batches with concurrent limit', async () => {
    // Mock podcast candidates
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        contains: vi.fn().mockReturnValue({
          data: mockPodcastIds.map((id) => ({ id }))
        })
      }),
      upsert: vi.fn().mockResolvedValue({ data: null })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    // Mock match generation
    vi.mocked(MatchMaker.generateMatch).mockImplementation(
      async (_, podcastId) => ({
        authorId: 'author123',
        podcastId,
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
        suggestedTopics: ['tech']
      })
    );

    const result = await CompatibilityService.findMatches(
      'author123',
      undefined,
      mockConfig
    );

    expect(result.matches.length).toBe(2); // Limited by maxResults
    expect(result.processedCount).toBe(3);
    expect(result.totalCandidates).toBe(3);
    expect(result.matches[0].score).toBe(0.85);
  });

  it('should apply filters correctly', async () => {
    const filter: MatchFilter = {
      minScore: 0.8,
      topics: ['technology'],
      excludePodcastIds: ['pod3']
    };

    // Mock filtered podcast candidates
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        contains: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            data: mockPodcastIds.slice(0, 2).map((id) => ({ id }))
          })
        })
      }),
      upsert: vi.fn().mockResolvedValue({ data: null })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    // Mock varying match scores
    vi.mocked(MatchMaker.generateMatch).mockImplementation(
      async (_, podcastId) => ({
        authorId: 'author123',
        podcastId,
        overallScore: podcastId === 'pod1' ? 0.9 : 0.7, // Only pod1 meets minScore
        confidence: 0.85,
        breakdown: {
          topicScore: 0.8,
          expertiseScore: 0.9,
          styleScore: 0.85,
          audienceScore: 0.9,
          formatScore: 0.8,
          explanation: ['Good match']
        },
        suggestedTopics: ['tech']
      })
    );

    const result = await CompatibilityService.findMatches(
      'author123',
      filter,
      mockConfig
    );

    expect(result.matches.length).toBe(1); // Only one match meets minScore
    expect(result.matches[0].podcastId).toBe('pod1');
    expect(result.processedCount).toBe(2);
  });

  it('should track processing status correctly', async () => {
    const statusUpdates: any[] = [];
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        contains: vi.fn().mockReturnValue({
          data: mockPodcastIds.map((id) => ({ id }))
        })
      }),
      upsert: vi.fn().mockImplementation(async (data) => {
        statusUpdates.push(data);
        return { data: null };
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    await CompatibilityService.findMatches('author123');

    expect(statusUpdates[0].status).toBe('processing');
    expect(statusUpdates[0].progress).toBe(0);
    expect(statusUpdates[statusUpdates.length - 1].status).toBe('completed');
    expect(statusUpdates[statusUpdates.length - 1].progress).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    // Mock database error
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        contains: vi.fn().mockRejectedValue(new Error('Database error'))
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    await expect(CompatibilityService.findMatches('author123')).rejects.toThrow(
      'Database error'
    );

    // Verify error status was recorded
    expect(supabase.from).toHaveBeenCalledWith('processing_status');
  });
});

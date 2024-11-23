// Set environment variables before anything else
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock';

import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockPodcasts = [{ id: 'pod1' }, { id: 'pod2' }, { id: 'pod3' }];

  return {
    createClient: () => ({
      from: (table: string) => ({
        select: () => ({
          ...mockPodcasts,
          then: (resolve: any) => resolve({ data: mockPodcasts, error: null })
        }),
        upsert: () => Promise.resolve({ data: null, error: null })
      })
    })
  };
});

// Mock MatchMaker
vi.mock('@/services/match-maker', () => ({
  MatchMaker: {
    generateMatch: vi.fn().mockImplementation(async (authorId, podcastId) => ({
      authorId,
      podcastId,
      overallScore:
        podcastId === 'pod1' ? 0.9 : podcastId === 'pod2' ? 0.85 : 0.8,
      confidence: 0.9,
      breakdown: {
        topicScore: 0.9,
        expertiseScore: 0.9,
        styleScore: 0.9,
        audienceScore: 0.9,
        formatScore: 0.9,
        lengthScore: 0.9,
        complexityScore: 0.9,
        qualityScore: 0.9,
        explanation: ['Good match']
      },
      suggestedTopics: ['tech']
    }))
  }
}));

// Import after mocks
import { CompatibilityService } from '@/services/compatibility-service';
import { BatchProcessConfig } from '@/types/compatibility';

describe('CompatibilityService', () => {
  const mockConfig: BatchProcessConfig = {
    maxConcurrent: 2,
    minMatchScore: 0.7,
    minConfidence: 0.8,
    maxResults: 2
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process matches in batches with concurrent limit', async () => {
    // Add debug logging for mock calls
    console.log('Starting test...');

    const result = await CompatibilityService.findMatches(
      'author123',
      undefined,
      mockConfig
    );

    // Debug output
    console.log('Match results:', JSON.stringify(result, null, 2));

    expect(result.matches).toHaveLength(2);
    expect(result.processedCount).toBe(3);
    expect(result.totalCandidates).toBe(3);
  });
});

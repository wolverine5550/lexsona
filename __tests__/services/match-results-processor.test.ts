import { vi, describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import type { PodcastMatch } from '@/types/matching';

// Mock OpenAI
vi.mock('openai', () => ({
  default: class OpenAIMock {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  strengths: ['Good topic match'],
                  considerations: ['Consider audience level'],
                  recommendations: ['Focus on key topics']
                })
              }
            }
          ]
        })
      }
    };
    constructor() {
      return this;
    }
  }
}));

// Mock Supabase
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'pod-1',
              name: 'Test Podcast',
              description: 'A test podcast'
            },
            error: null
          })
        })
      }),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    })
  })
}));

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    single: vi.fn(),
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn()
  }
}));

// Import after mocks
import { MatchResultsProcessor } from '@/services/match-results-processor';

describe('MatchResultsProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup successful mock returns
    (db.single as any).mockResolvedValue({
      id: '1',
      name: 'Test Author',
      email: 'test@example.com'
    });
  });

  it('should process match results successfully', async () => {
    const matchResult: PodcastMatch & { authorId: string } = {
      authorId: '1',
      podcastId: 'pod-1',
      overallScore: 0.8,
      confidence: 0.9,
      breakdown: {
        topicScore: 0.8,
        expertiseScore: 0.7,
        styleScore: 0.9,
        audienceScore: 0.8,
        formatScore: 0.7,
        lengthScore: 0.8,
        complexityScore: 0.9,
        qualityScore: 0.8,
        explanation: ['Good match based on topics']
      }
    };

    const result = await MatchResultsProcessor.processMatch(matchResult);
    expect(result).toBeDefined();
    expect(result.authorId).toBe('1');
    expect(result.podcastId).toBe('pod-1');
  });

  it('should handle errors gracefully', async () => {
    (db.single as any).mockRejectedValue(new Error('Database error'));

    const matchResult: PodcastMatch & { authorId: string } = {
      authorId: '1',
      podcastId: 'pod-1',
      overallScore: 0.8,
      confidence: 0.9,
      breakdown: {
        topicScore: 0.8,
        expertiseScore: 0.7,
        styleScore: 0.9,
        audienceScore: 0.8,
        formatScore: 0.7,
        lengthScore: 0.8,
        complexityScore: 0.9,
        qualityScore: 0.8,
        explanation: ['Good match based on topics']
      }
    };

    await expect(
      MatchResultsProcessor.processMatch(matchResult)
    ).rejects.toThrow('Database error');
  });
});

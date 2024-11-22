import { AuthorAnalyzer } from '@/services/author-analyzer';
import { AuthorProfile } from '@/types/author';
import { createClient } from '@supabase/supabase-js';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import OpenAI from 'openai';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn()
  }))
}));

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn()
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}));

describe('AuthorAnalyzer', () => {
  const mockAuthor: AuthorProfile = {
    id: '123',
    userId: 'user123',
    name: 'John Doe',
    bio: 'Tech entrepreneur and author',
    expertise: 'expert',
    communicationStyle: 'professional',
    books: [
      {
        id: 'book123',
        title: 'The Future of Tech',
        description: 'A comprehensive guide to emerging technologies',
        genre: ['Technology', 'Business'],
        targetAudience: ['Professionals', 'Entrepreneurs'],
        publishDate: new Date('2023-01-01'),
        keywords: ['AI', 'blockchain', 'future tech']
      }
    ],
    topics: ['technology', 'innovation'],
    keyPoints: ['digital transformation', 'tech trends']
  };

  const supabase = createClient('mock-url', 'mock-key');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached analysis if available and fresh', async () => {
    const mockCachedAnalysis = {
      topics: ['tech', 'innovation'],
      expertise_level: 'expert',
      communication_style: 'professional',
      key_points: ['point1', 'point2'],
      confidence: 0.9,
      analyzed_at: new Date().toISOString()
    };

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCachedAnalysis })
        })
      })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const result = await AuthorAnalyzer.analyze('123');

    expect(result).toEqual({
      topics: ['tech', 'innovation'],
      expertiseLevel: 'expert',
      communicationStyle: 'professional',
      keyPoints: ['point1', 'point2'],
      confidence: 0.9
    });
  });

  it('should perform new analysis if cache is stale', async () => {
    // Mock stale cached data
    const staleCachedAnalysis = {
      topics: ['old-tech'],
      expertise_level: 'expert',
      communication_style: 'professional',
      key_points: ['old-point'],
      confidence: 0.8,
      analyzed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days old
    };

    // Mock new AI analysis results
    const newAnalysis = {
      topics: ['new-tech'],
      expertiseLevel: 'expert',
      communicationStyle: 'professional',
      keyPoints: ['new-point'],
      confidence: 0.9
    };

    // Setup mocks
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: staleCachedAnalysis })
        })
      }),
      upsert: vi.fn().mockResolvedValue({ data: null })
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    // Mock OpenAI response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(newAnalysis)
          }
        }
      ]
    } as any);

    const result = await AuthorAnalyzer.analyze('123');

    expect(result).toEqual(newAnalysis);
    expect(supabase.from).toHaveBeenCalledWith('author_analysis');
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

    await expect(AuthorAnalyzer.analyze('123')).rejects.toThrow(
      'Database error'
    );

    // Mock OpenAI error
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('OpenAI API error')
    );

    await expect(AuthorAnalyzer.analyze('123')).rejects.toThrow(
      'OpenAI API error'
    );
  });
});

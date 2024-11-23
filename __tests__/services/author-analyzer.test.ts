import { vi, describe, beforeEach, it, expect } from 'vitest';

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';

// Mock OpenAI first
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  topics: ['old-tech'],
                  expertise_level: 'expert',
                  communication_style: 'professional',
                  key_points: ['old-point'],
                  confidence: 0.8,
                  expertiseLevel: 'expert',
                  communicationStyle: 'professional',
                  keyPoints: ['old-point']
                })
              }
            }
          ]
        })
      }
    }
  }))
}));

// Mock Supabase with factory function
vi.mock('@supabase/supabase-js', () => {
  const createMockData = () => ({
    author: null as any,
    analysis: null as any
  });

  const mockData = createMockData();

  return {
    createClient: () => ({
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: table === 'authors' ? mockData.author : mockData.analysis,
                error: null
              })
          })
        }),
        upsert: () => Promise.resolve({ data: null, error: null })
      }),
      __setMockData: (author: any, analysis: any) => {
        mockData.author = author;
        mockData.analysis = analysis;
      }
    })
  };
});

// Import after mocks
import { AuthorAnalyzer } from '@/services/author-analyzer';
import { AuthorProfile } from '@/types/author';
import { createClient } from '@supabase/supabase-js';

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
    (supabase as any).__setMockData(mockAuthor, null);
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

    (supabase as any).__setMockData(mockAuthor, mockCachedAnalysis);

    const result = await AuthorAnalyzer.analyze('123');

    expect(result).toEqual({
      topics: mockCachedAnalysis.topics,
      expertiseLevel: mockCachedAnalysis.expertise_level,
      communicationStyle: mockCachedAnalysis.communication_style,
      keyPoints: mockCachedAnalysis.key_points,
      confidence: mockCachedAnalysis.confidence
    });
  });

  it('should perform new analysis if cache is stale', async () => {
    const staleCachedAnalysis = {
      topics: ['tech', 'innovation'],
      expertise_level: 'expert',
      communication_style: 'professional',
      key_points: ['point1', 'point2'],
      confidence: 0.9,
      analyzed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    };

    (supabase as any).__setMockData(mockAuthor, staleCachedAnalysis);

    const result = await AuthorAnalyzer.analyze('123');

    expect(result).toEqual({
      topics: ['old-tech'],
      expertiseLevel: 'expert',
      communicationStyle: 'professional',
      keyPoints: ['old-point'],
      confidence: 0.8
    });
  });

  it('should handle errors gracefully', async () => {
    (supabase as any).__setMockData(null, null);

    await expect(AuthorAnalyzer.analyze('123')).rejects.toThrow(
      'Author not found'
    );
  });
});

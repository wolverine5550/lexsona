import * as dotenv from 'dotenv';
import path from 'path';
import { vi } from 'vitest';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock the Supabase client that match-maker.ts uses
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data:
              table === 'author_analysis'
                ? {
                    id: 'test-author-1',
                    topics: ['technology', 'AI', 'entrepreneurship'],
                    expertiseLevel: 'expert',
                    communicationStyle: 'professional',
                    keyPoints: ['AI expertise', 'startup growth'],
                    confidence: 0.9
                  }
                : {
                    id: 'test-podcast-1',
                    podcastId: 'test-podcast-1',
                    hostStyle: 'interview',
                    audienceLevel: 'expert',
                    topicDepth: 'deep',
                    guestRequirements: {
                      minimumExpertise: 'expert',
                      preferredTopics: [
                        'artificial intelligence',
                        'entrepreneurship'
                      ],
                      communicationPreference: ['professional', 'clear']
                    },
                    topicalFocus: ['technology', 'AI', 'business'],
                    confidence: 0.9,
                    lastAnalyzed: new Date()
                  },
            error: null
          })
        }))
      }))
    }))
  })
}));

// Mock AuthorAnalyzer
vi.mock('../../services/author-analyzer', () => ({
  AuthorAnalyzer: {
    analyze: vi.fn().mockResolvedValue({
      id: 'test-author-1',
      topics: ['technology', 'AI', 'entrepreneurship'],
      expertiseLevel: 'expert',
      communicationStyle: 'professional',
      keyPoints: ['AI expertise', 'startup growth'],
      confidence: 0.9
    })
  }
}));

// Mock PodcastAnalyzer
vi.mock('../../services/podcast-analyzer', () => ({
  PodcastAnalyzer: {
    analyze: vi.fn().mockResolvedValue({
      id: 'test-podcast-1',
      podcastId: 'test-podcast-1',
      hostStyle: 'interview',
      audienceLevel: 'expert',
      topicDepth: 'deep',
      guestRequirements: {
        minimumExpertise: 'expert',
        preferredTopics: ['artificial intelligence', 'entrepreneurship'],
        communicationPreference: ['professional', 'clear']
      },
      topicalFocus: ['technology', 'AI', 'business'],
      confidence: 0.9,
      lastAnalyzed: new Date()
    })
  }
}));

// Mock ListenNotes client
vi.mock('../../services/listen-notes', () => ({
  ListenNotesClient: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue([
      {
        id: 'test-podcast-1',
        title: 'AI and Entrepreneurship Today',
        description:
          'A podcast about artificial intelligence and startup growth',
        publisher: 'Tech Media Inc',
        categories: ['Technology', 'Business', 'AI'],
        averageEpisodeLength: 45,
        totalEpisodes: 100,
        language: 'English',
        type: 'episodic'
      },
      {
        id: 'test-podcast-2',
        title: 'StartupTech Radio',
        description: 'Weekly discussions about technology startups',
        publisher: 'Startup Media',
        categories: ['Technology', 'Entrepreneurship'],
        averageEpisodeLength: 30,
        totalEpisodes: 200,
        language: 'English',
        type: 'episodic'
      }
    ])
  }))
}));

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hostStyle: 'interview',
                  audienceLevel: 'expert',
                  topicDepth: 'deep',
                  guestRequirements: {
                    minimumExpertise: 'expert',
                    preferredTopics: [
                      'artificial intelligence',
                      'entrepreneurship'
                    ],
                    communicationPreference: ['professional', 'clear']
                  },
                  topicalFocus: ['technology', 'AI', 'business'],
                  confidence: 0.9
                })
              }
            }
          ]
        })
      }
    }
  }))
}));

// Debug: Log environment variables (redacted for security)
console.log('OpenAI Key exists:', !!process.env.OPENAI_API_KEY);
console.log('ListenNotes Key exists:', !!process.env.LISTEN_NOTES_API_KEY);
console.log('Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);

// Debug more extensively
console.log('OpenAI Key:', process.env.OPENAI_API_KEY?.slice(0, 5) + '...');
console.log(
  'ListenNotes Key:',
  process.env.LISTEN_NOTES_API_KEY?.slice(0, 5) + '...'
);

// Now import everything else
import { OpenAI } from 'openai';
import { ListenNotesClient } from '../../services/listen-notes';
import { AuthorAnalyzer } from '../../services/author-analyzer';
import { PodcastAnalyzer } from '../../services/podcast-analyzer';
import { MatchMaker } from '../../services/match-maker';
import type { Author, AuthorWork } from '../../types/author';
import type { Podcast, PodcastBase } from '../../types/podcast';

// Real author data for testing
const testAuthor: Author = {
  id: 'test-author-1',
  name: 'John Doe',
  bio: 'Tech entrepreneur and AI researcher with 10 years of experience in machine learning and startup scaling. Expertise in artificial intelligence, entrepreneurship, and technology.',
  avatar: 'https://example.com/avatar.jpg',
  location: 'San Francisco, CA',
  joinedDate: '2023-01-01',
  socialLinks: {},
  works: [
    {
      id: 'work-1',
      title: 'Building AI Startups',
      description: 'A guide to scaling AI companies',
      publishDate: '2023',
      coverImage: 'https://example.com/cover.jpg',
      publisher: 'Tech Publishing House',
      genre: ['Technology', 'Business']
    }
  ],
  interviews: [],
  followers: 0,
  following: 0,
  totalListens: 0
};

describe('API Integration Tests', () => {
  let openai: OpenAI;
  let listenNotes: ListenNotesClient;

  beforeAll(() => {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    listenNotes = new ListenNotesClient(
      process.env.LISTEN_NOTES_API_KEY as string
    );
  });

  it('should analyze author and find matching podcasts', async () => {
    // 1. Analyze author
    const authorAnalysis = await AuthorAnalyzer.analyze(testAuthor.id);
    console.log('\nAuthor Analysis:', JSON.stringify(authorAnalysis, null, 2));

    // 2. Get podcasts from ListenNotes
    const podcasts = await listenNotes.search({
      q: 'artificial intelligence entrepreneurship',
      type: 'podcast',
      language: 'English',
      len_min: 20,
      len_max: 60
    });
    console.log(
      '\nFound Podcasts:',
      podcasts.slice(0, 3).map((p: PodcastBase) => ({
        title: p.title,
        description: p.description?.slice(0, 100) + '...',
        categories: p.categories.join(', ')
      }))
    );

    // 3. Analyze first podcast
    const testPodcast = podcasts[0];
    const podcastAnalysis = await PodcastAnalyzer.analyze(testPodcast);
    expect(podcastAnalysis).toBeDefined();
    console.log(
      '\nPodcast Analysis:',
      JSON.stringify(podcastAnalysis, null, 2)
    );

    // 4. Generate match
    const match = await MatchMaker.generateMatch(testAuthor.id, testPodcast.id);
    expect(match).toBeDefined();

    // Log detailed results
    console.log('\nMatch Results:');
    console.log('-------------');
    console.log(`Overall Score: ${(match.overallScore * 100).toFixed(1)}%`);
    console.log(`Confidence: ${(match.confidence * 100).toFixed(1)}%`);

    console.log('\nBreakdown:');
    console.log('----------');
    Object.entries(match.breakdown).forEach(([factor, score]) => {
      if (typeof score === 'number') {
        console.log(`${factor}: ${(score * 100).toFixed(1)}%`);
      }
    });

    const suggestedTopics = match.suggestedTopics || [];
    if (suggestedTopics.length > 0) {
      console.log('\nSuggested Topics:');
      console.log('----------------');
      suggestedTopics.forEach((topic) => console.log(`- ${topic}`));
    }
  }, 30000); // Increased timeout for API calls
});

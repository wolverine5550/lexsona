import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TieredMatchingService } from '@/services/tiered-matching-service';
import { PodcastMatchingService } from '@/services/matching';
import { ListenNotesClient } from '@/services/listen-notes';
import type { PodcastMatch } from '@/types/matching';
import type { UserPreferences, PodcastTopic } from '@/types/preferences';

// Mock types
type MockPodcastMatchingService = {
  findMatches: typeof PodcastMatchingService.findMatches;
};

interface ListenNotesPodcast {
  id: string;
  title: string;
  description: string;
  publisher: string;
  genre_ids: number[];
  total_episodes: number;
  listen_score: number;
  image: string;
  website: string;
  language: string;
  explicit_content: boolean;
  latest_pub_date_ms: number;
}

interface ListenNotesSearchResponse {
  results: Array<ListenNotesPodcast>;
  total: number;
  count: number;
  next_offset: number;
}

// Mock the existing services
vi.mock('@/services/matching', () => ({
  PodcastMatchingService: {
    findMatches: vi.fn()
  }
}));

vi.mock('@/services/listen-notes', () => ({
  ListenNotesClient: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      results: [],
      total: 0,
      count: 0,
      next_offset: 0
    })
  }))
}));

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  })
}));

describe('TieredMatchingService', () => {
  const mockPreferences: Pick<
    UserPreferences,
    'topics' | 'preferredLength' | 'stylePreferences'
  > = {
    topics: ['technology' as PodcastTopic],
    preferredLength: 'medium',
    stylePreferences: {
      isInterviewPreferred: true,
      isStorytellingPreferred: false,
      isEducationalPreferred: true,
      isDebatePreferred: false
    }
  };

  const mockGoodMatch: PodcastMatch = {
    id: 'match1',
    podcastId: 'test1',
    overallScore: 0.9,
    confidence: 0.8,
    breakdown: {
      topicScore: 0.9,
      expertiseScore: 0.8,
      styleScore: 0.9,
      audienceScore: 0.8,
      formatScore: 0.8,
      lengthScore: 0.9,
      complexityScore: 0.8,
      qualityScore: 0.9,
      explanation: ['Good match']
    },
    suggestedTopics: ['technology', 'programming'],
    podcast: {
      title: 'Tech Talk',
      category: 'Technology',
      description: 'A tech podcast',
      listeners: 1000,
      rating: 4.5,
      frequency: 'weekly'
    }
  };

  const mockPoorMatch: PodcastMatch = {
    ...mockGoodMatch,
    id: 'match2',
    podcastId: 'test2',
    overallScore: 0.4,
    confidence: 0.5,
    suggestedTopics: ['business']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findMatches', () => {
    it('should return local matches if they are sufficient', async () => {
      // Mock good local matches
      const mockMatches = [
        mockGoodMatch,
        { ...mockGoodMatch, id: 'match3', podcastId: 'test3' },
        { ...mockGoodMatch, id: 'match4', podcastId: 'test4' }
      ];
      vi.mocked(PodcastMatchingService.findMatches).mockResolvedValueOnce(
        mockMatches
      );

      const result = await TieredMatchingService.findMatches(mockPreferences);

      expect(result).toHaveLength(3);
      expect(PodcastMatchingService.findMatches).toHaveBeenCalledTimes(1);
    });

    it('should fetch from API if local matches are insufficient', async () => {
      // Mock poor local matches
      vi.mocked(PodcastMatchingService.findMatches).mockResolvedValueOnce([
        mockPoorMatch
      ]);

      // Mock API search results
      const mockApiResponse: ListenNotesSearchResponse = {
        results: [
          {
            id: 'api1',
            title: 'API Podcast',
            description: 'From API',
            publisher: 'Test Publisher',
            genre_ids: [123],
            total_episodes: 50,
            listen_score: 80,
            image: 'https://example.com/image.jpg',
            website: 'https://example.com',
            language: 'English',
            explicit_content: false,
            latest_pub_date_ms: Date.now()
          }
        ],
        total: 1,
        count: 1,
        next_offset: 0
      };

      const mockListenNotes = new ListenNotesClient('fake-key');
      vi.mocked(mockListenNotes.search).mockResolvedValueOnce(mockApiResponse);

      const result = await TieredMatchingService.findMatches(mockPreferences);

      expect(PodcastMatchingService.findMatches).toHaveBeenCalledTimes(2);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock poor local matches
      vi.mocked(PodcastMatchingService.findMatches).mockResolvedValueOnce([
        mockPoorMatch
      ]);

      // Mock API error
      const mockListenNotes = new ListenNotesClient('fake-key');
      vi.mocked(mockListenNotes.search).mockRejectedValueOnce(
        new Error('API Error')
      );

      const result = await TieredMatchingService.findMatches(mockPreferences);

      // Should fall back to local matches
      expect(result).toHaveLength(1);
      expect(result[0].podcastId).toBe('test2');
    });

    it('should deduplicate combined results', async () => {
      // Mock overlapping local and API matches
      vi.mocked(PodcastMatchingService.findMatches)
        .mockResolvedValueOnce([mockGoodMatch]) // Local
        .mockResolvedValueOnce([mockGoodMatch]); // API (same match)

      const result = await TieredMatchingService.findMatches(mockPreferences);

      // Should only include unique matches
      expect(result).toHaveLength(1);
      expect(result[0].podcastId).toBe('test1');
    });
  });
});

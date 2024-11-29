import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PodcastSearch from '@/components/podcast/PodcastSearch';
import { setupSupabaseMock } from '../setup/mockSupabase';

// Set up Supabase mock
setupSupabaseMock();

// Mock hooks
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ session: null, isLoading: false })
}));

vi.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    recordSearch: vi.fn(),
    searchHistory: [],
    isLoading: false
  })
}));

// Mock components
vi.mock('@/components/podcast/PodcastList', () => ({
  default: ({ podcasts }: any) => (
    <div data-testid="podcast-list">
      {podcasts?.map((p: any) => (
        <div key={p.id} data-testid="podcast-item">
          {p.title}
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/podcast/SearchHistory', () => ({
  default: () => <div>Search History</div>
}));

// Mock search function
const mockSearchPodcasts = vi.fn();
vi.mock('@/utils/listen-notes', () => ({
  searchPodcasts: (...args: any[]) => mockSearchPodcasts(...args)
}));

describe('Search Flow', () => {
  const mockPodcastResult = {
    id: '1',
    title: 'Test Podcast',
    description: 'Test description',
    image: 'test.jpg',
    publisher: 'Test Publisher',
    website: 'https://test.com',
    language: 'English',
    categories: [{ id: 1, name: 'Technology' }],
    total_episodes: 10,
    listen_score: 80,
    explicit_content: false,
    latest_episode_id: 'ep1',
    latest_pub_date_ms: 1234567890
  };

  beforeEach(() => {
    vi.clearAllMocks();
    let resolveSearchPromise: (value: any) => void;
    const searchPromise = new Promise((resolve) => {
      resolveSearchPromise = resolve;
    });

    mockSearchPodcasts.mockImplementation(() => {
      setTimeout(() => {
        resolveSearchPromise({ results: [mockPodcastResult] });
      }, 100);
      return searchPromise;
    });
  });

  it('should complete search flow', async () => {
    render(<PodcastSearch />);

    // Perform search
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Wait for and verify loading state
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    // Wait for and verify results
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
        const results = screen.getByTestId('podcast-item');
        expect(results).toHaveTextContent('Test Podcast');
      },
      { timeout: 1000 }
    );

    // Verify search was called with correct params
    expect(mockSearchPodcasts).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'test',
        language: 'English',
        sort_by_date: 0
      }),
      expect.anything()
    );
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import PodcastSearch from '@/components/podcast/PodcastSearch';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupSupabaseMock } from '../../setup/mockSupabase';

// Set up Supabase mock
setupSupabaseMock();

// Mock hooks
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({ session: null, isLoading: false })
}));

// Mock search function
const mockSearchPodcasts = vi.fn();
vi.mock('@/utils/listen-notes', () => ({
  searchPodcasts: (...args: any[]) => mockSearchPodcasts(...args)
}));

// Mock components
vi.mock('@/components/podcast/PodcastList', () => ({
  default: ({ podcasts }: { podcasts: any[] }) => (
    <div data-testid="podcast-list">
      {podcasts?.map((podcast) => (
        <div key={podcast.id} data-testid="podcast-item">
          {podcast.title}
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/podcast/SearchHistory', () => ({
  default: () => <div>Search History</div>
}));

describe('PodcastSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful search', async () => {
    // Create a delayed mock response
    mockSearchPodcasts.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              results: [
                {
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
                }
              ]
            });
          }, 100);
        })
    );

    render(<PodcastSearch />);

    // Perform search
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Wait for loading state
    const loadingState = await screen.findByTestId('loading-state');
    expect(loadingState).toBeInTheDocument();

    // Wait for results
    const results = await screen.findByTestId('podcast-item');
    expect(results).toHaveTextContent('Test Podcast');

    // Verify loading state is gone
    expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
  });

  it('should handle search error', async () => {
    mockSearchPodcasts.mockRejectedValueOnce(new Error('Search failed'));

    render(<PodcastSearch />);

    // Perform search
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'test' }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Wait for error message
    const error = await screen.findByTestId('error-message');
    expect(error).toHaveTextContent('Search failed');
  });
});

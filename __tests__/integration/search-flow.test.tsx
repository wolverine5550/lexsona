import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PodcastSearch from '@/components/podcast/PodcastSearch';
import { setupCommonMocks } from '../setup/commonMocks';

setupCommonMocks();

// Mock search function
const mockSearchPodcasts = vi.fn();
vi.mock('@/utils/listen-notes', () => ({
  searchPodcasts: () => mockSearchPodcasts()
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

describe('Search Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchPodcasts.mockResolvedValue({
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
  });

  it('should complete search flow', async () => {
    render(<PodcastSearch />);

    // Perform search
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, {
      target: { value: 'test' }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Wait for results
    const results = await screen.findByTestId('podcast-item');
    expect(results).toHaveTextContent('Test Podcast');
  });
});

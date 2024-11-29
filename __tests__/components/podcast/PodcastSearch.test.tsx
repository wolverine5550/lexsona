import { render, screen, fireEvent } from '@testing-library/react';
import PodcastSearch from '@/components/podcast/PodcastSearch';
import { describe, it, expect, vi } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';

// Mock search function
const mockSearchPodcasts = vi.fn();
vi.mock('@/utils/listen-notes', () => ({
  searchPodcasts: () => mockSearchPodcasts()
}));

// Mock components
vi.mock('@/components/podcast/PodcastList', () => ({
  default: ({ podcasts }: any) => (
    <div data-testid="podcast-results">
      {podcasts?.map((p: any) => (
        <div key={p.id} data-testid="podcast-result-item">
          {p.title}
        </div>
      ))}
    </div>
  )
}));

describe('PodcastSearch', () => {
  beforeAll(() => {
    setupCommonMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle successful search', async () => {
    mockSearchPodcasts.mockResolvedValueOnce({
      results: [{ id: '1', title: 'Test Podcast' }]
    });

    const { container } = render(<PodcastSearch />);
    const searchInput = container.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;

    // Perform search
    fireEvent.change(searchInput, {
      target: { value: 'test' }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Wait for results
    const results = await screen.findByTestId('podcast-results');
    expect(results).toBeInTheDocument();
    expect(screen.getByTestId('podcast-result-item')).toHaveTextContent(
      'Test Podcast'
    );
  });

  it('should handle search error', async () => {
    mockSearchPodcasts.mockRejectedValueOnce(new Error('Search failed'));

    const { container } = render(<PodcastSearch />);
    const searchInput = container.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;

    // Perform search
    fireEvent.change(searchInput, {
      target: { value: 'test' }
    });
    fireEvent.submit(screen.getByRole('form'));

    // Wait for error message
    const error = await screen.findByTestId('error-message');
    expect(error).toHaveTextContent('Search failed');
  });
});

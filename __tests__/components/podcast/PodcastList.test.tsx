import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import PodcastList from '@/components/podcast/PodcastList';

// Mock all external dependencies
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      })
    })
  })
}));

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user' } },
    isLoading: false
  })
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />
}));

// Mock SavePodcastButton
vi.mock('@/components/podcast/SavePodcastButton', () => ({
  default: () => <button>Save</button>
}));

const mockPodcasts = [
  {
    id: '1',
    title: 'Test Podcast 1',
    publisher: 'Publisher 1',
    image: 'test.jpg',
    description: 'Test description',
    website: 'https://test.com',
    language: 'English',
    categories: [{ id: 1, name: 'Technology' }],
    total_episodes: 10,
    listen_score: 80,
    explicit_content: false,
    latest_episode_id: 'ep1',
    latest_pub_date_ms: 1234567890
  }
];

describe('PodcastList', () => {
  it('should render loading state', () => {
    render(<PodcastList podcasts={[]} isLoading={true} />);
    const loadingElements = screen.getAllByRole('article', {
      name: /loading/i
    });
    expect(loadingElements).toHaveLength(3);
  });

  it('should render podcasts', () => {
    render(<PodcastList podcasts={mockPodcasts} />);
    expect(screen.getByText('Test Podcast 1')).toBeInTheDocument();
  });

  it('should handle selection', () => {
    const handleSelect = vi.fn();
    render(
      <PodcastList podcasts={mockPodcasts} onPodcastSelect={handleSelect} />
    );

    screen.getByText('Test Podcast 1').click();
    expect(handleSelect).toHaveBeenCalledWith(mockPodcasts[0]);
  });
});

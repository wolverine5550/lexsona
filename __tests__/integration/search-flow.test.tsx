import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PodcastSearch from '@/components/podcast/PodcastSearch';
import * as listenNotesModule from '@/utils/listen-notes';
import { createClient } from '@/utils/supabase/client';

// Mock PodcastList component
vi.mock('@/components/podcast/PodcastList', () => ({
  default: ({ podcasts }: any) => (
    <div data-testid="podcast-list">
      {podcasts?.map((podcast: any) => (
        <div key={podcast.id}>{podcast.title}</div>
      ))}
    </div>
  )
}));

// Mock the entire listen-notes module
vi.mock('@/utils/listen-notes', () => ({
  searchPodcasts: vi.fn(),
  cachePodcastResults: vi.fn()
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

// Mock useSession hook
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user' } },
    isLoading: false
  })
}));

// Mock useSearchHistory hook
vi.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    recordSearch: vi.fn(),
    recordClick: vi.fn(),
    searchHistory: [],
    isLoading: false,
    clearHistory: vi.fn()
  })
}));

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: '1' }, error: null })
        })
      }),
      upsert: () => Promise.resolve({ error: null })
    })
  })
}));

// Mock SearchHistory component
vi.mock('@/components/podcast/SearchHistory', () => ({
  default: () => <div data-testid="search-history">Search History Mock</div>
}));

describe('Search & Filter Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search and display results', async () => {
    const mockResults = {
      count: 1,
      total: 1,
      next_offset: 1,
      results: [
        {
          id: '1',
          title: 'Test Podcast',
          publisher: 'Test Publisher',
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
      ]
    };

    // Mock the search function
    vi.mocked(listenNotesModule.searchPodcasts).mockResolvedValue(mockResults);

    render(<PodcastSearch />);

    // Fill in search input
    const searchInput = screen.getByPlaceholderText(/enter keywords/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Submit form
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByTestId('podcast-list')).toBeInTheDocument();
      expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    });
  });
});

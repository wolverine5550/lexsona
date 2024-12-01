import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SavedPodcastsList from '@/components/author/podcasts/SavedPodcastsList';
import {
  PodcastInteraction,
  PodcastShow,
  PodcastEpisode,
  PodcastStatus
} from '@/types/podcast';

// Mock data
const mockShow: PodcastShow = {
  id: '1',
  name: 'Writing Life',
  description: 'A podcast about writing and creativity',
  coverImage: '/images/podcasts/writing-life.jpg',
  hostName: 'Jane Smith',
  category: ['Writing', 'Creativity'],
  averageListeners: 5000,
  websiteUrl: 'https://writinglife.com',
  socialLinks: {
    twitter: 'https://twitter.com/writinglife'
  }
};

const mockEpisode: PodcastEpisode = {
  id: '1',
  showId: '1',
  title: 'Finding Your Creative Voice',
  description: 'Discussion about developing your unique writing style',
  publishDate: '2024-01-15',
  duration: '45:00',
  listenerCount: 5500,
  audioUrl: 'https://example.com/episode1.mp3'
};

const mockInteraction: PodcastInteraction & {
  show: PodcastShow;
  episode: PodcastEpisode;
} = {
  id: '1',
  authorId: '1',
  episodeId: '1',
  showId: '1',
  status: 'SAVED',
  savedDate: '2024-01-15',
  show: mockShow,
  episode: mockEpisode
};

describe('SavedPodcastsList', () => {
  it('renders podcast information correctly', () => {
    render(
      <SavedPodcastsList
        interactions={[mockInteraction]}
        onSelectPodcast={() => {}}
      />
    );

    expect(screen.getByText(mockShow.name)).toBeInTheDocument();
    expect(screen.getByText(mockEpisode.title)).toBeInTheDocument();
    expect(screen.getByText('5,500 listeners')).toBeInTheDocument();
  });

  it('handles sorting by listeners', () => {
    const interactions = [
      { ...mockInteraction },
      {
        ...mockInteraction,
        id: '2',
        episode: { ...mockEpisode, listenerCount: 10000 }
      }
    ];

    render(
      <SavedPodcastsList
        interactions={interactions}
        onSelectPodcast={() => {}}
      />
    );

    // Change sort to listeners
    fireEvent.change(screen.getByDisplayValue('Sort by Date'), {
      target: { value: 'listeners' }
    });

    const listenerCounts = screen.getAllByText(/listeners$/);
    expect(listenerCounts[0]).toHaveTextContent('10,000');
  });

  it('filters by status correctly', () => {
    const interactions = [
      { ...mockInteraction, status: 'SAVED' as PodcastStatus },
      {
        ...mockInteraction,
        id: '2',
        status: 'MATCHED' as PodcastStatus,
        show: {
          ...mockShow,
          name: 'Author Talk'
        }
      }
    ];

    render(
      <SavedPodcastsList
        interactions={interactions}
        onSelectPodcast={() => {}}
      />
    );

    // Select MATCHED filter
    fireEvent.change(screen.getByDisplayValue('All Status'), {
      target: { value: 'MATCHED' }
    });

    // After filtering, we should only see Author Talk (MATCHED) and not Writing Life (SAVED)
    expect(screen.queryByText('Writing Life')).not.toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
    expect(screen.getByText('MATCHED')).toBeInTheDocument();
  });

  it('calls onSelectPodcast when clicking a podcast', () => {
    const handleSelect = vi.fn();

    render(
      <SavedPodcastsList
        interactions={[mockInteraction]}
        onSelectPodcast={handleSelect}
      />
    );

    fireEvent.click(screen.getByText(mockShow.name));
    expect(handleSelect).toHaveBeenCalledWith(mockInteraction);
  });
});

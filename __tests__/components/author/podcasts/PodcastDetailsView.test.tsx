import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PodcastDetailsView from '@/components/author/podcasts/PodcastDetailsView';
import {
  PodcastShow,
  PodcastEpisode,
  PodcastInteraction,
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
    twitter: 'https://twitter.com/writinglife',
    linkedin: 'https://linkedin.com/in/writinglife'
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
  audioUrl: 'https://example.com/episode1.mp3',
  transcriptUrl: 'https://example.com/transcript1.pdf'
};

const mockInteraction: PodcastInteraction & {
  show: PodcastShow;
  episode: PodcastEpisode;
} = {
  id: '1',
  authorId: '1',
  episodeId: '1',
  showId: '1',
  status: 'SAVED' as PodcastStatus,
  savedDate: '2024-01-15',
  notes: 'Initial test notes',
  show: mockShow,
  episode: mockEpisode
};

describe('PodcastDetailsView', () => {
  it('renders podcast information correctly', () => {
    render(
      <PodcastDetailsView
        interaction={mockInteraction}
        onBack={() => {}}
        onStatusChange={() => {}}
        onNotesChange={() => {}}
      />
    );

    expect(screen.getByText(mockShow.name)).toBeInTheDocument();
    expect(
      screen.getByText(`Hosted by ${mockShow.hostName}`)
    ).toBeInTheDocument();
    expect(screen.getByText(mockEpisode.title)).toBeInTheDocument();
    expect(screen.getByText('5,500 listeners')).toBeInTheDocument();
  });

  it('handles status changes', () => {
    const handleStatusChange = vi.fn();

    render(
      <PodcastDetailsView
        interaction={mockInteraction}
        onBack={() => {}}
        onStatusChange={handleStatusChange}
        onNotesChange={() => {}}
      />
    );

    fireEvent.change(screen.getByDisplayValue('Saved'), {
      target: { value: 'MATCHED' }
    });

    expect(handleStatusChange).toHaveBeenCalledWith('MATCHED');
  });

  it('handles notes editing', async () => {
    const handleNotesChange = vi.fn();

    render(
      <PodcastDetailsView
        interaction={mockInteraction}
        onBack={() => {}}
        onStatusChange={() => {}}
        onNotesChange={handleNotesChange}
      />
    );

    // Click edit button
    fireEvent.click(screen.getByText('Edit'));

    // Update notes
    const textarea = screen.getByPlaceholderText(
      'Add your notes about this podcast...'
    );
    fireEvent.change(textarea, {
      target: { value: 'Updated notes' }
    });

    // Save notes
    fireEvent.click(screen.getByText('Save Notes'));

    expect(handleNotesChange).toHaveBeenCalledWith('Updated notes');
  });

  it('displays social links correctly', () => {
    render(
      <PodcastDetailsView
        interaction={mockInteraction}
        onBack={() => {}}
        onStatusChange={() => {}}
        onNotesChange={() => {}}
      />
    );

    const twitterLink = screen.getByLabelText('Twitter profile');
    expect(twitterLink).toHaveAttribute('href', mockShow.socialLinks.twitter);
  });

  it('handles back button click', () => {
    const handleBack = vi.fn();

    render(
      <PodcastDetailsView
        interaction={mockInteraction}
        onBack={handleBack}
        onStatusChange={() => {}}
        onNotesChange={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText('Go back'));
    expect(handleBack).toHaveBeenCalled();
  });
});

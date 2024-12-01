import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchHistory from '@/components/author/podcasts/MatchHistory';
import { PodcastMatchWithDetails, MatchOutcome } from '@/types/podcast';

// Mock data
const createMockMatch = (
  overrides: Partial<PodcastMatchWithDetails> = {}
): PodcastMatchWithDetails => ({
  id: '1',
  podcastId: 'pod1',
  authorId: 'auth1',
  bookId: 'book1',
  initialContactDate: '2024-01-15',
  outcome: 'PENDING' as MatchOutcome,
  followUpCount: 2,
  matchConfidence: 0.85,
  matchReasons: ['Topic match', 'Audience size'],
  score: 0.75,
  podcast: {
    name: 'Writing Life',
    hostName: 'Jane Smith',
    coverImage: '/images/podcasts/writing-life.jpg',
    category: ['Writing', 'Creativity'],
    averageListeners: 5000
  },
  ...overrides
});

const mockMatches = [
  createMockMatch(),
  createMockMatch({
    id: '2',
    outcome: 'ACCEPTED' as MatchOutcome,
    initialContactDate: '2024-01-10',
    matchConfidence: 0.95,
    podcast: {
      name: 'Author Talk',
      hostName: 'John Doe',
      coverImage: '/images/podcasts/author-talk.jpg',
      category: ['Books', 'Publishing'],
      averageListeners: 10000
    }
  })
];

describe('MatchHistory', () => {
  it('renders match list correctly', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
    expect(screen.getByText('Hosted by Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Hosted by John Doe')).toBeInTheDocument();
  });

  it('filters matches by outcome', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    // Select ACCEPTED filter
    fireEvent.change(screen.getByDisplayValue('All Outcomes'), {
      target: { value: 'ACCEPTED' }
    });

    // Should only show the ACCEPTED match
    expect(screen.queryByText('Writing Life')).not.toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
  });

  it('sorts matches by date', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    const matches = screen.getAllByRole('heading', { level: 3 });
    expect(matches[0]).toHaveTextContent('Writing Life'); // Most recent first
    expect(matches[1]).toHaveTextContent('Author Talk');
  });

  it('sorts matches by confidence when selected', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    // Change sort to confidence
    fireEvent.change(screen.getByDisplayValue('Sort by Date'), {
      target: { value: 'confidence' }
    });

    const matches = screen.getAllByRole('heading', { level: 3 });
    expect(matches[0]).toHaveTextContent('Author Talk'); // Higher confidence first
    expect(matches[1]).toHaveTextContent('Writing Life');
  });

  it('filters matches by search query', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    const searchInput = screen.getByPlaceholderText('Search podcasts...');
    fireEvent.change(searchInput, { target: { value: 'writing' } });

    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.queryByText('Author Talk')).not.toBeInTheDocument();
  });

  it('calls onSelectMatch when clicking a match', () => {
    const handleSelect = vi.fn();
    render(<MatchHistory matches={mockMatches} onSelectMatch={handleSelect} />);

    fireEvent.click(screen.getByText('Writing Life'));
    expect(handleSelect).toHaveBeenCalledWith(mockMatches[0]);
  });

  it('displays match reasons', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    // Get the first match's reasons (using getAllByText and checking the first one)
    const topicMatches = screen.getAllByText('Topic match', {
      selector: 'span.text-xs' // This will match only the reason tags
    });
    const audienceMatches = screen.getAllByText('Audience size', {
      selector: 'span.text-xs'
    });

    // Verify we have the correct number of tags
    expect(topicMatches).toHaveLength(2); // One for each match
    expect(audienceMatches).toHaveLength(2);

    // Verify the styling
    expect(topicMatches[0]).toHaveClass('bg-blue-50', 'text-blue-700');
    expect(audienceMatches[0]).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('formats listener count correctly', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    expect(screen.getByText('5,000 avg. listeners')).toBeInTheDocument();
    expect(screen.getByText('10,000 avg. listeners')).toBeInTheDocument();
  });

  it('displays correct outcome badges', () => {
    render(<MatchHistory matches={mockMatches} onSelectMatch={() => {}} />);

    // Look for the status badges specifically (not the select options)
    const pendingBadge = screen.getByText('Pending Response', {
      selector: 'span.rounded-full' // This will match only the badge span, not the select option
    });
    const acceptedBadge = screen.getByText('Accepted', {
      selector: 'span.rounded-full'
    });

    expect(pendingBadge).toBeInTheDocument();
    expect(acceptedBadge).toBeInTheDocument();

    // Optionally, verify the badge styling
    expect(pendingBadge).toHaveClass('bg-yellow-50', 'text-yellow-700');
    expect(acceptedBadge).toHaveClass('bg-green-50', 'text-green-700');
  });
});

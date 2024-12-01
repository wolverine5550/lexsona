import { render, screen } from '@testing-library/react';
import InterviewsPreview from '@/components/author/InterviewsPreview';
import { AuthorInterview } from '@/types/author';

const mockInterviews: AuthorInterview[] = [
  {
    id: '1',
    title: 'Writing Journey Interview',
    podcastName: 'Author Talk',
    date: '2024-01-07T12:00:00Z',
    duration: '45:00',
    listenerCount: 1500,
    episodeUrl: 'https://example.com/episode-1'
  },
  {
    id: '2',
    title: 'Creative Process Discussion',
    podcastName: "Writer's Corner",
    date: '2024-01-07T12:00:00Z',
    duration: '30:00',
    listenerCount: 2000,
    episodeUrl: 'https://example.com/episode-2'
  }
];

describe('InterviewsPreview', () => {
  it('renders interview cards with correct information', () => {
    render(<InterviewsPreview interviews={mockInterviews} />);

    mockInterviews.forEach((interview) => {
      expect(screen.getByText(interview.title)).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes(interview.podcastName))
      ).toBeInTheDocument();
      expect(screen.getByText(interview.duration)).toBeInTheDocument();
    });
  });

  it('formats dates correctly', () => {
    render(<InterviewsPreview interviews={mockInterviews} />);

    const dates = screen.getAllByTestId('interview-date');
    expect(dates[0]).toHaveTextContent('Jan 7, 2024');
    expect(dates[1]).toHaveTextContent('Jan 7, 2024');
  });

  it('displays listener counts with proper formatting', () => {
    render(<InterviewsPreview interviews={mockInterviews} />);

    const listenerCounts = screen.getAllByTestId('listener-count');
    expect(listenerCounts[0]).toHaveTextContent('1,500');
    expect(listenerCounts[1]).toHaveTextContent('2,000');
  });

  it('renders listen buttons with correct links', () => {
    render(<InterviewsPreview interviews={mockInterviews} />);

    const listenButtons = screen.getAllByRole('link', { name: /Listen/i });
    listenButtons.forEach((button, index) => {
      expect(button).toHaveAttribute('href', mockInterviews[index].episodeUrl);
      expect(button).toHaveAttribute('target', '_blank');
      expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('handles empty interviews array gracefully', () => {
    render(<InterviewsPreview interviews={[]} />);

    expect(screen.getByText('No interviews available')).toBeInTheDocument();
  });

  // Test for accessibility
  it('uses semantic HTML and proper ARIA attributes', () => {
    render(<InterviewsPreview interviews={mockInterviews} />);

    const articles = screen.getAllByRole('article');
    articles.forEach((article) => {
      expect(article).toHaveAttribute('aria-label');
    });

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('aria-label');
    });
  });
});

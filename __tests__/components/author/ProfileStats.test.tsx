import { render, screen } from '@testing-library/react';
import ProfileStats from '@/components/author/ProfileStats';
import { Author } from '@/types/author';

// Create mock author data
const mockAuthor: Author = {
  id: '1',
  name: 'John Doe',
  avatar: '/images/avatars/john-doe.jpg',
  bio: 'Test author bio',
  location: 'New York, USA',
  joinedDate: '2023-01-01',
  totalListens: 15000,
  followers: 1000,
  following: 500,
  socialLinks: {
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe'
  },
  works: [],
  interviews: []
};

describe('ProfileStats', () => {
  it('renders all stat categories', () => {
    render(<ProfileStats author={mockAuthor} />);

    // Check for all stat labels
    expect(screen.getByText('Total Listens')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    render(<ProfileStats author={mockAuthor} />);

    // Check for formatted numbers
    expect(screen.getByText('15,000')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('applies correct styling to stat cards', () => {
    render(<ProfileStats author={mockAuthor} />);

    const statCards = screen.getAllByTestId('stat-card');
    statCards.forEach((card) => {
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'p-6');
    });
  });

  // Test for accessibility
  it('uses semantic HTML and proper ARIA attributes', () => {
    render(<ProfileStats author={mockAuthor} />);

    const statLabels = screen.getAllByTestId('stat-label');
    statLabels.forEach((label) => {
      expect(label).toHaveAttribute('aria-label');
    });
  });
});

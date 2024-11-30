import { render, screen } from '@testing-library/react';
import AnalyticsSummary from '@/components/author/analytics/AnalyticsSummary';
import { Author } from '@/types/author';
import { describe, it, expect, vi } from 'vitest';

// Create a complete mock author that satisfies the Author type
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

describe('AnalyticsSummary', () => {
  // Test suite setup
  beforeEach(() => {
    // Reset any mocks or setup before each test
  });

  it('renders all analytics cards with correct titles', () => {
    render(<AnalyticsSummary author={mockAuthor} />);

    // Check for all card titles
    const expectedTitles = [
      'Total Listens',
      'Active Listeners',
      'Avg. Listen Time',
      'Engagement Rate'
    ];

    expectedTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('formats total listens with proper number formatting', () => {
    render(<AnalyticsSummary author={mockAuthor} />);

    // Check if the number is formatted with commas
    expect(screen.getByText('15,000')).toBeInTheDocument();
  });

  it('displays trend indicators with correct formatting', () => {
    render(<AnalyticsSummary author={mockAuthor} />);

    // Get all percentage values
    const trendIndicators = screen.getAllByText(/%$/);

    // Should have at least one trend indicator
    expect(trendIndicators.length).toBeGreaterThan(0);

    // Check if trend indicators have the correct format (+X% or -X%)
    trendIndicators.forEach((indicator) => {
      expect(indicator.textContent).toMatch(/^[+-]?\d+(\.\d+)?%$/);
    });
  });

  it('applies correct color classes based on trends', () => {
    render(<AnalyticsSummary author={mockAuthor} />);

    // Check for positive trend styling
    const positiveElements = document.getElementsByClassName('text-green-600');
    expect(positiveElements.length).toBeGreaterThan(0);

    // Check for negative trend styling
    const negativeElements = document.getElementsByClassName('text-red-600');
    expect(negativeElements.length).toBeGreaterThan(0);
  });
});

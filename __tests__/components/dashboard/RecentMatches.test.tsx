import { render, screen } from '@testing-library/react';
import { RecentMatches } from '@/components/dashboard/RecentMatches';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { setupCommonMocks } from '../../setup/commonMocks';

describe('RecentMatches', () => {
  beforeAll(() => {
    setupCommonMocks();
  });
  it('should render matches list', () => {
    render(<RecentMatches />);

    // Use more specific queries
    const matches = screen.getAllByRole('heading', { level: 3 });
    expect(matches[0]).toHaveTextContent('The Author Hour');
    expect(matches[1]).toHaveTextContent('Book Talk Daily');

    // Check scores
    expect(screen.getByText('95% Match')).toBeInTheDocument();
    expect(screen.getByText('88% Match')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { RecentMatches } from '@/components/dashboard/RecentMatches';
import { describe, it, expect } from 'vitest';

describe('RecentMatches', () => {
  it('should render matches list', () => {
    render(<RecentMatches />);

    // Check if podcast names are rendered
    expect(screen.getByText('The Author Hour')).toBeInTheDocument();
    expect(screen.getByText('Book Talk Daily')).toBeInTheDocument();

    // Check if match scores are rendered
    expect(screen.getByText('95% Match')).toBeInTheDocument();
    expect(screen.getByText('88% Match')).toBeInTheDocument();

    // Check if host names are rendered
    expect(screen.getByText('Host: Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Host: Mike Smith')).toBeInTheDocument();
  });
});

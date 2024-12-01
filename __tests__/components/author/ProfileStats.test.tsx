import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileStats from '@/components/author/ProfileStats';
import { mockAuthor } from '@/__tests__/setup/commonMocks';

describe('ProfileStats', () => {
  it('renders all stat categories', () => {
    render(<ProfileStats author={mockAuthor} />);

    expect(screen.getByText('Total Listens')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('Published Works')).toBeInTheDocument();
  });

  it('formats numbers correctly', () => {
    render(<ProfileStats author={mockAuthor} />);

    // Check for formatted numbers
    expect(screen.getByText('15,000')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    // Should be checking for works.length instead of following
    expect(
      screen.getByText(mockAuthor.works.length.toString())
    ).toBeInTheDocument();
  });

  it('applies correct styling to stat cards', () => {
    render(<ProfileStats author={mockAuthor} />);

    const statCards = screen.getAllByTestId('stat-card');
    statCards.forEach((card) => {
      expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'p-6');
    });
  });

  it('uses semantic HTML and proper ARIA attributes', () => {
    render(<ProfileStats author={mockAuthor} />);

    const statLabels = screen.getAllByTestId('stat-label');
    statLabels.forEach((label) => {
      expect(label).toHaveAttribute('aria-label');
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PopularWorks from '@/components/author/analytics/PopularWorks';
import { AuthorWork } from '@/types/author';

const mockWorks: AuthorWork[] = [
  {
    id: '1',
    title: 'Test Book',
    coverImage: '/test.jpg',
    publishDate: '2024-01-01',
    publisher: 'Test Publisher',
    genre: ['Fiction'],
    description: 'Test description'
  }
];

describe('PopularWorks', () => {
  it('renders works list', () => {
    render(<PopularWorks works={mockWorks} />);
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  it('displays listen counts', () => {
    render(<PopularWorks works={mockWorks} />);
    expect(screen.getByText(/listens$/)).toBeInTheDocument();
  });

  it('handles empty works array', () => {
    render(<PopularWorks works={[]} />);
    expect(screen.getByText(/No works available/i)).toBeInTheDocument();
  });
});

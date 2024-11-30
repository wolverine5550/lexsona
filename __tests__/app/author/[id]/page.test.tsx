import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthorProfile from '@/app/author/[id]/page';
import { notFound } from 'next/navigation';

// Mock the navigation functions
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

describe('AuthorProfile Page', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when author is not found', async () => {
    await AuthorProfile({ params: mockParams });
    expect(notFound).toHaveBeenCalled();
  });

  // Add more tests when getAuthor is implemented
});

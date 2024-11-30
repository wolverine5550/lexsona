import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EditProfilePage from '@/app/author/[id]/edit/page';
import { notFound } from 'next/navigation';

vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

describe('EditProfile Page', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when author is not found', async () => {
    await EditProfilePage({ params: mockParams });
    expect(notFound).toHaveBeenCalled();
  });

  // Add more tests when getAuthor is implemented
});

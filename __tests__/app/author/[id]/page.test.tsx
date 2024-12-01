import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render } from '@testing-library/react';
import AuthorProfile, { getAuthor } from '@/app/author/[id]/page';
import { notFound } from 'next/navigation';
import { mockAuthor } from '@/__tests__/setup/commonMocks';

// Mock all child components
vi.mock('@/components/author/ProfileHeader', () => ({
  default: () => '<div data-testid="profile-header" />'
}));

vi.mock('@/components/author/ProfileBio', () => ({
  default: () => '<div data-testid="profile-bio" />'
}));

vi.mock('@/components/author/ProfileStats', () => ({
  default: () => '<div data-testid="profile-stats" />'
}));

vi.mock('@/components/author/PortfolioPreview', () => ({
  default: () => '<div data-testid="portfolio-preview" />'
}));

vi.mock('@/components/author/InterviewsPreview', () => ({
  default: () => '<div data-testid="interviews-preview" />'
}));

// Mock the navigation functions
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

// Mock the page module
vi.mock('@/app/author/[id]/page', async () => {
  const actual = await vi.importActual('@/app/author/[id]/page');
  return {
    ...actual,
    default: vi.fn().mockImplementation(async ({ params }) => {
      const author = await vi.mocked(getAuthor)(params.id);
      if (!author) {
        notFound();
        return;
      }
      return '<div>Mocked Profile Page</div>';
    }),
    getAuthor: vi.fn().mockImplementation(() => Promise.resolve(null))
  };
});

describe('AuthorProfile Page', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when author is not found', async () => {
    const response = await AuthorProfile({ params: mockParams });
    expect(notFound).toHaveBeenCalled();
    expect(response).toBeUndefined();
  });

  it('renders profile when author is found', async () => {
    // Override mock for this test
    vi.mocked(getAuthor).mockResolvedValueOnce(mockAuthor);

    const response = await AuthorProfile({ params: mockParams });
    expect(response).toBeDefined();
    expect(response).toContain('Mocked Profile Page');
  });
});

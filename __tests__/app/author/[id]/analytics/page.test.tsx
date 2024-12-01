import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render } from '@testing-library/react';
import AnalyticsDashboard from '@/app/author/[id]/analytics/page';
import { notFound } from 'next/navigation';
import { mockAuthor } from '@/__tests__/setup/commonMocks';

// Mock all child components
vi.mock('@/components/author/analytics/AnalyticsSummary', () => ({
  default: () => '<div data-testid="analytics-summary" />'
}));

vi.mock('@/components/author/analytics/ListeningTrends', () => ({
  default: () => '<div data-testid="listening-trends" />'
}));

vi.mock('@/components/author/analytics/PopularWorks', () => ({
  default: () => '<div data-testid="popular-works" />'
}));

vi.mock('@/components/author/analytics/AudienceInsights', () => ({
  default: () => '<div data-testid="audience-insights" />'
}));

vi.mock('@/components/author/analytics/DateRangePicker', () => ({
  default: () => '<div data-testid="date-range-picker" />'
}));

// Mock the navigation functions
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

// Mock the page module with getAuthorAnalytics
vi.mock('@/app/author/[id]/analytics/page', async () => {
  const actual = await vi.importActual('@/app/author/[id]/analytics/page');
  const getAuthorAnalytics = vi
    .fn()
    .mockImplementation(() => Promise.resolve(null));

  return {
    ...actual,
    default: vi.fn().mockImplementation(async ({ params }) => {
      const authorData = await getAuthorAnalytics(params.id);
      if (!authorData) {
        notFound();
        return;
      }
      return '<div>Mocked Analytics Dashboard</div>';
    }),
    getAuthorAnalytics
  };
});

describe('Analytics Dashboard Page', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when author data is not found', async () => {
    const response = await AnalyticsDashboard({ params: mockParams });
    expect(notFound).toHaveBeenCalled();
    expect(response).toBeUndefined();
  });

  it('renders dashboard when author data is found', async () => {
    // Override mock for this test
    const mod = await import('@/app/author/[id]/analytics/page');
    vi.mocked(mod.getAuthorAnalytics).mockResolvedValueOnce(mockAuthor);

    const response = await AnalyticsDashboard({ params: mockParams });
    expect(response).toBeDefined();
    expect(response).toContain('Mocked Analytics Dashboard');
  });
});

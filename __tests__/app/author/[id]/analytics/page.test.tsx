import { describe, it, beforeEach, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsDashboard from '@/app/author/[id]/analytics/page';
import { notFound } from 'next/navigation';

vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}));

describe('Analytics Dashboard Page', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls notFound when author data is not found', async () => {
    await AnalyticsDashboard({ params: mockParams });
    expect(notFound).toHaveBeenCalled();
  });

  // Add more tests when getAuthorAnalytics is implemented
});

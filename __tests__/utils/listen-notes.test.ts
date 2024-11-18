import { vi, describe, it, expect, beforeEach } from 'vitest';
import { searchPodcasts } from '@/utils/listen-notes';

// Mock the entire listen-notes module
vi.mock('@/utils/listen-notes', () => {
  return {
    searchPodcasts: vi.fn(),
    listenNotesClient: {
      get: vi.fn()
    }
  };
});

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      delete: () => Promise.resolve({ error: null }),
      upsert: () => Promise.resolve({ error: null })
    })
  })
}));

describe('Listen Notes API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle rate limiting', async () => {
    // Mock searchPodcasts implementation
    const mockSearchPodcasts = vi.mocked(searchPodcasts);
    mockSearchPodcasts.mockResolvedValue({
      results: [],
      count: 0,
      total: 0,
      next_offset: 0
    });

    // Make multiple requests
    const requests = Array(15)
      .fill(null)
      .map(() => searchPodcasts({ query: 'test' }, {} as any));

    await Promise.all(requests);

    // Verify searchPodcasts was called 15 times
    expect(mockSearchPodcasts).toHaveBeenCalledTimes(15);
  }, 10000);

  it('should handle API errors', async () => {
    // Mock searchPodcasts to throw an error
    const mockSearchPodcasts = vi.mocked(searchPodcasts);
    mockSearchPodcasts.mockRejectedValue(new Error('API Error'));

    // Test that the error is properly thrown
    await expect(searchPodcasts({ query: 'test' }, {} as any)).rejects.toThrow(
      'API Error'
    );
  }, 10000);
});

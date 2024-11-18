import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePreferences } from '@/hooks/usePreferences';
import type { StylePreferences } from '@/types/preferences';

// Mock complete style preferences
const mockStylePreferences: StylePreferences = {
  isInterviewPreferred: true,
  isStorytellingPreferred: false,
  isEducationalPreferred: false,
  isDebatePreferred: false
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useSession
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    session: { user: { id: 'test-user' } },
    isLoading: false
  })
}));

describe('usePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch preferences on mount', async () => {
    // Mock successful API response with complete style preferences
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '1',
          topics: ['technology'],
          preferredLength: 'medium',
          stylePreferences: mockStylePreferences
        })
    });

    const { result } = renderHook(() => usePreferences());

    // Should start loading
    expect(result.current.isLoading).toBe(true);

    // Wait for fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should have loaded preferences
    expect(result.current.preferences).toEqual({
      id: '1',
      topics: ['technology'],
      preferredLength: 'medium',
      stylePreferences: mockStylePreferences
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle save preferences', async () => {
    // Mock successful save with complete style preferences
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '1',
          topics: ['technology'],
          preferredLength: 'medium',
          stylePreferences: mockStylePreferences
        })
    });

    const { result } = renderHook(() => usePreferences());

    // Save new preferences
    await act(async () => {
      await result.current.savePreferences({
        topics: ['technology'],
        preferredLength: 'medium',
        stylePreferences: mockStylePreferences
      });
    });

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topics: ['technology'],
        preferredLength: 'medium',
        stylePreferences: mockStylePreferences
      })
    });
  });

  it('should handle errors', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const { result } = renderHook(() => usePreferences());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });
});

import { renderHook, act } from '@testing-library/react';
import { usePreferences } from '@/hooks/usePreferences';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockUpsert = vi.fn();
const mockSupabase = {
  from: vi.fn(() => ({
    upsert: mockUpsert
  }))
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('usePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle save preferences', async () => {
    // Mock successful upsert
    mockUpsert.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => usePreferences('user1'));

    await act(async () => {
      await result.current.savePreferences({
        preferred_categories: ['technology', 'business']
      });
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user1',
        preferred_categories: ['technology', 'business']
      })
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle errors', async () => {
    // Mock failed upsert
    mockUpsert.mockResolvedValueOnce({ error: new Error('Failed to save') });

    const { result } = renderHook(() => usePreferences('user1'));

    await act(async () => {
      try {
        await result.current.savePreferences({
          preferred_categories: ['technology']
        });
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });
});

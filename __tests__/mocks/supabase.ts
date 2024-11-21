import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createSupabaseMock = () => {
  const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [], error: null })
  });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
    insert: mockInsert
  });

  const mockClient = {
    from: mockFrom
  } as unknown as SupabaseClient;

  return {
    mockClient,
    mockFrom,
    mockSelect,
    mockUpsert,
    mockInsert
  };
};

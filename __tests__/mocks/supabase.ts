import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createSupabaseMock = () => {
  const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: '1' }, error: null })
    })
  });
  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
    insert: mockInsert
  });

  const mockClient = {
    from: mockFrom,
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null })
    }
  } as unknown as SupabaseClient;

  return mockClient;
};

// Mock the entire client module
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn().mockImplementation(() => createSupabaseMock())
}));

// Mock createBrowserClient
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn().mockImplementation(() => createSupabaseMock())
}));

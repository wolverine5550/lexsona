import { vi } from 'vitest';

// Define mock channel factory outside the setup function
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue(null),
  unsubscribe: vi.fn().mockResolvedValue(null)
});

// Define mock client factory
const createMockClient = () => ({
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    then: vi.fn().mockResolvedValue({ data: [], error: null })
  }),
  auth: {
    getSession: vi
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: null, error: null })
  },
  channel: vi.fn().mockReturnValue(createMockChannel())
});

export const setupSupabaseMock = () => {
  // Mock environment variables first
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

  // Mock createBrowserClient
  vi.mock('@supabase/ssr', () => ({
    createBrowserClient: () => createMockClient()
  }));

  // Mock Supabase client
  vi.mock('@/utils/supabase/client', () => ({
    createClient: vi.fn().mockReturnValue(createMockClient())
  }));
};

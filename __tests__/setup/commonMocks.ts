import { vi } from 'vitest';

// Define mock channel factory
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue(null),
  unsubscribe: vi.fn().mockResolvedValue(null)
});

// Define mock client factory with extended functionality
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: null, error: null })
  },
  channel: vi.fn().mockReturnValue(createMockChannel())
});

export const setupCommonMocks = () => {
  // Mock environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

  // Mock hooks
  vi.mock('@/hooks/useSession', () => ({
    useSession: () => ({ session: null, isLoading: false })
  }));

  // Mock Supabase client
  vi.mock('@/utils/supabase/client', () => ({
    createClient: () => createMockClient()
  }));

  // Mock createBrowserClient
  vi.mock('@supabase/ssr', () => ({
    createBrowserClient: () => createMockClient()
  }));
};

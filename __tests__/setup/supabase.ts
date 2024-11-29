import { vi } from 'vitest';

// Define mock client factory
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({ data: null, error: null })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null })
  }
});

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => createMockClient()
}));

// Mock createBrowserClient
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => createMockClient()
}));

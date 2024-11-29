import { vi } from 'vitest';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
  }
}));

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          data: [],
          error: null
        }),
        data: [],
        error: null
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        })
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null })
    }
  })
}));

// Mock createBrowserClient
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn().mockImplementation(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          data: [],
          error: null
        }),
        data: [],
        error: null
      })
    }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null })
    }
  }))
}));

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/types_db';

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return '';
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: { path: string }) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=${value}; path=${options.path}`;
        },
        remove(name: string, options: { path: string }) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=; path=${options.path}; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
        }
      }
    }
  );

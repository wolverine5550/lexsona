import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

/**
 * Gets the current authenticated session
 * Used in API routes and server components
 * @returns The current session or null if not authenticated
 */
export async function auth() {
  const supabase = createServerComponentClient<Database>({ cookies });

  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

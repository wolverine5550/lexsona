import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Cache the client instance
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null =
  null;

/**
 * Creates or returns a cached Supabase client for client-side use
 *
 * This utility:
 * - Creates a Supabase client with the correct configuration
 * - Caches the client to prevent multiple instantiations
 * - Uses environment variables for configuration
 * - Includes proper typing for the database schema
 *
 * @returns A typed Supabase client instance
 */
export function createClient() {
  // Return cached instance if it exists
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    );
  }

  // Create new client instance
  supabaseClient = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        // Persist session in localStorage by default
        persistSession: true,
        // Update window location on auth events
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  return supabaseClient;
}

/**
 * Reset the cached Supabase client
 * Useful for testing or when you need to force a new client instance
 */
export function resetClient() {
  supabaseClient = null;
}

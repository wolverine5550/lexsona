import { useState, useEffect } from 'react';
import { User, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to handle user authentication state
 *
 * This hook provides:
 * - Current user data
 * - Loading state while checking authentication
 * - Error state if authentication check fails
 *
 * It automatically updates when the user's authentication state changes
 * by subscribing to Supabase auth state changes.
 */
export function useUser(): UseUserReturn {
  // Initialize state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get Supabase client
    const supabase = createClient();

    // Get initial user state
    const initializeUser = async () => {
      try {
        setLoading(true);

        // Get current session
        const {
          data: { user },
          error: sessionError
        } = await supabase.auth.getUser();

        if (sessionError) {
          throw sessionError;
        }

        setUser(user);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get user'));
      } finally {
        setLoading(false);
      }
    };

    // Initialize
    initializeUser();

    // Subscribe to auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      // Update user state based on auth events
      switch (event) {
        case 'SIGNED_IN':
          setUser(session?.user ?? null);
          break;
        case 'SIGNED_OUT':
          setUser(null);
          break;
        case 'USER_UPDATED':
          setUser(session?.user ?? null);
          break;
        case 'TOKEN_REFRESHED':
          setUser(session?.user ?? null);
          break;
        case 'MFA_CHALLENGE_VERIFIED':
          setUser(session?.user ?? null);
          break;
        // Handle other valid auth events as needed
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array as we only want to run this once

  return { user, loading, error };
}

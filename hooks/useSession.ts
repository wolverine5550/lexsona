'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

/**
 * Custom hook to manage Supabase session state
 * Handles session monitoring, expiration, and refresh attempts
 */
export function useSession() {
  const router = useRouter();
  const supabase = createClient();

  // Track session state
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track refresh attempts to prevent infinite loops
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const MAX_REFRESH_ATTEMPTS = 3;

  /**
   * Attempts to refresh the session
   * @returns boolean indicating if refresh was successful
   */
  const refreshSession = async (): Promise<boolean> => {
    try {
      const {
        data: { session: newSession },
        error
      } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (newSession) {
        setSession(newSession);
        setRefreshAttempts(0); // Reset attempts on success
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  };

  /**
   * Handles session expiration
   * Attempts to refresh, redirects to login if unsuccessful
   */
  const handleSessionExpired = async () => {
    setIsLoading(true);

    // Only attempt refresh if we haven't exceeded max attempts
    if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
      const success = await refreshSession();
      if (success) {
        setIsLoading(false);
        return;
      }
      setRefreshAttempts((prev) => prev + 1);
    }

    // If refresh fails or max attempts reached, redirect to login
    router.push(
      '/signin?message=Your session has expired. Please sign in again.'
    );
  };

  // Set up session listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Subscribe to session changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [supabase]);

  // Monitor session expiration
  useEffect(() => {
    if (!session) return;

    const expiresAt = new Date(session.expires_at! * 1000);
    const timeUntilExpiry = expiresAt.getTime() - Date.now();

    // If session is already expired
    if (timeUntilExpiry <= 0) {
      handleSessionExpired();
      return;
    }

    // Set up timer to handle expiration
    const expiryTimer = setTimeout(() => {
      handleSessionExpired();
    }, timeUntilExpiry);

    // Cleanup timer
    return () => clearTimeout(expiryTimer);
  }, [session]);

  return {
    session,
    isLoading,
    refreshSession
  };
}

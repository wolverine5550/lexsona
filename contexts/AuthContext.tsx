'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect
} from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<User | void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Context for authentication state and methods
 * Provides user data and authentication functions throughout the app
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app and makes auth object available
 * to any child component that calls useAuth().
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Get initial user
    const initUser = async () => {
      try {
        console.log('Initializing user...');
        const {
          data: { user },
          error
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (mounted) {
          console.log('Setting initial user:', user);
          setUser(user);
        }
      } catch (e) {
        console.error('Error getting user:', e);
        if (mounted) {
          setError(e as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initUser();

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (mounted) {
        try {
          if (session?.user) {
            setUser(session.user);
          } else {
            const {
              data: { user }
            } = await supabase.auth.getUser();
            setUser(user);
          }
        } catch (error) {
          console.error('Error updating user:', error);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        if (!data.user) throw new Error('No user returned from sign in');

        // Get fresh user data
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;

        setUser(userData.user);
        return userData.user;
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    },
    [supabase.auth]
  );

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw error;
    }
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    try {
      // Immediately redirect to home page
      window.location.href = '/';

      // Then clean up auth state
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [supabase.auth]);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) {
      throw error;
    }
  }, []);

  // Create value object
  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for using auth context
 *
 * @throws {Error} If used outside of AuthProvider
 * @returns Authentication context value
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

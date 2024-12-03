'use client';

import { createContext, useContext, ReactNode, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
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
  // Get user state from hook
  const { user, loading, error } = useUser();
  const supabase = createClient();

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
  }, []);

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, []);

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

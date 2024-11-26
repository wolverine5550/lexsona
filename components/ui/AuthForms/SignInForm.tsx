'use client';

import { useState } from 'react';
import { BaseAuthForm } from './BaseAuthForm';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function SignInForm() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'email' | 'password'>('email');

  /**
   * Handle form submission for both email magic link and password sign in
   * @param formData - Form data from the submit event
   */
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const supabase = createClient();

    if (authMode === 'email') {
      // Send magic link email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      // Show success message
      return { message: 'Check your email for the login link!' };
    } else {
      // Sign in with password
      const password = formData.get('password') as string;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Redirect to dashboard on success
      router.push('/dashboard');
    }
  };

  /**
   * Footer component with links to other auth options
   */
  const AuthFooter = () => (
    <div className="space-y-4 text-center text-sm text-zinc-400">
      {/* Toggle between email/password modes */}
      <button
        type="button"
        onClick={() => setAuthMode(authMode === 'email' ? 'password' : 'email')}
        className="hover:text-white"
      >
        {authMode === 'email'
          ? 'Sign in with password instead'
          : 'Sign in with magic link instead'}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
        </div>
      </div>

      {/* Sign up link */}
      <p>
        Don't have an account?{' '}
        <Link href="/signup" className="text-blue-500 hover:text-blue-400">
          Sign up
        </Link>
      </p>

      {/* Password reset link - only show in password mode */}
      {authMode === 'password' && (
        <p>
          <Link
            href="/reset-password"
            className="text-blue-500 hover:text-blue-400"
          >
            Forgot your password?
          </Link>
        </p>
      )}
    </div>
  );

  return (
    <BaseAuthForm
      onSubmit={handleSubmit}
      submitText={authMode === 'email' ? 'Send Magic Link' : 'Sign In'}
      footer={<AuthFooter />}
    >
      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-200"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      {/* Password Input - only show in password mode */}
      {authMode === 'password' && (
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-200"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
      )}
    </BaseAuthForm>
  );
}

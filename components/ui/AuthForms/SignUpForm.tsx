'use client';

import { BaseAuthForm } from './BaseAuthForm';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function SignUpForm() {
  const router = useRouter();

  /**
   * Handle sign up form submission
   * Creates new user account and redirects to onboarding
   */
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const supabase = createClient();

    // Create new user account
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;

    // Redirect to onboarding
    router.push('/onboarding');
  };

  /**
   * Footer component with links to other auth options
   */
  const AuthFooter = () => (
    <div className="space-y-4 text-center text-sm text-zinc-400">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
        </div>
      </div>

      {/* Sign in link */}
      <p>
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-500 hover:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  );

  return (
    <BaseAuthForm
      onSubmit={handleSubmit}
      submitText="Create Account"
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

      {/* Password Input */}
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
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="••••••••"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Must be at least 8 characters
        </p>
      </div>

      {/* Confirm Password Input */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-zinc-200"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <label className="flex items-start">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 rounded border-zinc-800 bg-zinc-900 text-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-zinc-400">
            I agree to the{' '}
            <Link
              href="/terms"
              className="text-blue-500 hover:text-blue-400"
              target="_blank"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-blue-500 hover:text-blue-400"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </span>
        </label>
      </div>
    </BaseAuthForm>
  );
}

'use client';

import { BaseAuthForm } from './BaseAuthForm';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function PasswordResetForm() {
  const router = useRouter();

  /**
   * Handle password reset form submission
   * Sends password reset email or updates password based on mode
   */
  const handleSubmit = async (formData: FormData) => {
    const email = formData.get('email') as string;
    const supabase = createClient();

    // Check if we're in update mode (user has clicked reset link)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Handle password update
      const newPassword = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Validate passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Redirect to sign in
      router.push('/signin');
      return { message: 'Password updated successfully!' };
    } else {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password#recovery`
      });

      if (error) throw error;

      return {
        message: 'Check your email for the password reset link!'
      };
    }
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
        Remember your password?{' '}
        <Link href="/signin" className="text-blue-500 hover:text-blue-400">
          Sign in
        </Link>
      </p>
    </div>
  );

  // Check if we're in update mode
  const isUpdateMode =
    typeof window !== 'undefined' &&
    window.location.hash.includes('type=recovery');

  return (
    <BaseAuthForm
      onSubmit={handleSubmit}
      submitText={isUpdateMode ? 'Update Password' : 'Send Reset Link'}
      footer={<AuthFooter />}
    >
      {!isUpdateMode ? (
        // Email input for reset link
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
      ) : (
        // Password inputs for update mode
        <>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-200"
            >
              New Password
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-200"
            >
              Confirm New Password
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
        </>
      )}
    </BaseAuthForm>
  );
}

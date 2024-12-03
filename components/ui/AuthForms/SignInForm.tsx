'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useSearchParams } from 'next/navigation';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting sign in...');
      const user = await signIn(email, password);
      console.log('Sign in successful, user:', user);

      // Show success message
      toast({
        title: 'Success',
        description: 'You have been signed in successfully.'
      });

      // Get return URL from query parameters or use default
      const returnUrl = searchParams?.get('from') || '/dashboard';
      console.log('Redirecting to:', returnUrl);

      // Add a small delay to ensure toast is shown
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force a hard navigation
      window.location.href = returnUrl;
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Invalid email or password.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-200"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-200"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-zinc-400">
          <Link
            href="/auth/forgot-password"
            className="text-blue-500 hover:text-blue-400"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-500 hover:text-blue-400">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

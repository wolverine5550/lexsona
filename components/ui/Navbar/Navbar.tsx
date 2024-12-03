'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toasts/use-toast';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.'
      });

      // Force a hard navigation to sign-in
      window.location.href = '/signin';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-white">
          Lexsona
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-sm text-zinc-400">Loading...</span>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white"
              >
                Dashboard
              </Link>
              <span className="text-sm text-zinc-400">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

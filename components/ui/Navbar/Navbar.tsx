'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, loading: authLoading, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-white">
          Lexsona
        </Link>

        <div className="flex items-center gap-4">
          {authLoading ? (
            <span className="text-sm text-zinc-400">Loading...</span>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                className="text-sm text-zinc-400 hover:text-white"
              >
                Account
              </Link>
              <Link
                href="/help"
                className="text-sm text-zinc-400 hover:text-white"
              >
                Help
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-400 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm text-zinc-400 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

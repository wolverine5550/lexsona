'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b border-zinc-800 bg-black">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-white">
          Lexsona
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-400 hover:text-white"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
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
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
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

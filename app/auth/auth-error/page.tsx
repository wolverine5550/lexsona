import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Error Icon */}
      <div className="mb-6 rounded-full bg-red-500/10 p-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </div>

      {/* Error Message */}
      <h1 className="mb-2 text-2xl font-bold text-white">
        Authentication Error
      </h1>
      <p className="mb-6 text-center text-zinc-400">
        There was a problem authenticating your account.
        <br />
        Please try signing in again.
      </p>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Link
          href="/signin"
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

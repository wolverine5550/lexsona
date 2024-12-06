import Logo from '@/components/icons/Logo';
import Link from 'next/link';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header with Logo */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/" className="flex items-center">
          <Logo className="h-8 w-8" />
          <span className="ml-3 text-lg font-bold text-white">Lexsona</span>
        </Link>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-1/2 right-1/2 h-[1000px] w-[1000px] translate-x-1/2 rounded-full bg-gradient-to-tr from-purple-500/10 to-pink-500/10 blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Content Card */}
        <div className="w-full max-w-md">
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-sm">
            {/* Card Glow Effects */}
            <div className="absolute -top-px left-5 right-5 h-px bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent" />
            <div className="absolute -bottom-px left-5 right-5 h-px bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent" />

            {/* Form Content */}
            {children}
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 text-center text-sm bg-zinc-900/50 backdrop-blur-sm border-t border-zinc-800">
        <p className="text-zinc-400">
          By continuing, you agree to our{' '}
          <Link
            href="/terms"
            className="text-zinc-300 hover:text-white underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="text-zinc-300 hover:text-white underline"
          >
            Privacy Policy
          </Link>
        </p>
        <p className="mt-2 text-zinc-500">
          &copy; {new Date().getFullYear()} Lexsona. All rights reserved.
        </p>
      </div>
    </div>
  );
}

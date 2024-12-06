'use client';

import { User } from '@supabase/supabase-js';
import { MatchList } from './MatchList';
import { DashboardProvider } from '@/contexts/dashboard/DashboardContext';

interface DashboardContentProps {
  user: User;
}

export function DashboardContent({ user }: DashboardContentProps) {
  // Extract first name from user metadata or email
  const firstName =
    user.user_metadata?.first_name || user.email?.split('@')[0] || 'there';

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Add padding for navbar */}
          <div className="pt-24 pb-12">
            {/* Header Section */}
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Welcome back, {firstName}
              </h1>
              <p className="mt-3 text-lg text-zinc-400">
                Here are your latest podcast matches
              </p>
            </div>

            {/* Main Content */}
            <div>
              <MatchList limit={5} />
            </div>
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}

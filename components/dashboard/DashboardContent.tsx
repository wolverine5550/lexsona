'use client';

import { User } from '@supabase/supabase-js';
import { StatsCard } from './StatsCard';
import { MatchList } from './MatchList';
import { InterviewSchedule } from './InterviewSchedule';
import { ActivityFeed } from './ActivityFeed';
import { NotificationPanel } from './NotificationPanel';
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Add padding for navbar */}
          <div className="pt-24 pb-12">
            {/* Header Section */}
            <div className="mb-12">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Welcome back, {firstName}
              </h1>
              <p className="mt-3 text-lg text-zinc-400">
                Here's what's happening with your podcast outreach
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-8 mb-12 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Matches"
                value="24"
                trend="+12%"
                trendDirection="up"
              />
              <StatsCard
                title="Pending Requests"
                value="8"
                trend="+3"
                trendDirection="up"
              />
              <StatsCard
                title="Upcoming Interviews"
                value="3"
                trend="Next: Tomorrow"
              />
              <StatsCard
                title="Profile Views"
                value="156"
                trend="+23%"
                trendDirection="up"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-12">
                {/* Recent Matches */}
                <section className="bg-zinc-900/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Recent Matches
                    </h2>
                    <a
                      href="#"
                      className="text-sm text-blue-500 hover:text-blue-400"
                    >
                      View all
                    </a>
                  </div>
                  <MatchList limit={5} />
                </section>

                {/* Upcoming Interviews */}
                <section className="bg-zinc-900/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Upcoming Interviews
                    </h2>
                    <a
                      href="#"
                      className="text-sm text-blue-500 hover:text-blue-400"
                    >
                      View calendar
                    </a>
                  </div>
                  <InterviewSchedule />
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-12">
                {/* Activity Feed */}
                <section className="bg-zinc-900/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Recent Activity
                    </h2>
                    <a
                      href="#"
                      className="text-sm text-blue-500 hover:text-blue-400"
                    >
                      View all
                    </a>
                  </div>
                  <ActivityFeed />
                </section>

                {/* Notifications */}
                <section className="bg-zinc-900/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">
                      Notifications
                    </h2>
                    <button className="text-sm text-blue-500 hover:text-blue-400">
                      Mark all as read
                    </button>
                  </div>
                  <NotificationPanel />
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardProvider>
  );
}

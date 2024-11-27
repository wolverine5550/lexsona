import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentMatches } from '@/components/dashboard/RecentMatches';
import { UpcomingInterviews } from '@/components/dashboard/UpcomingInterviews';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Recent Matches */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">
              Recent Matches
            </h2>
            <RecentMatches />
          </section>

          {/* Upcoming Interviews */}
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">
              Upcoming Interviews
            </h2>
            <UpcomingInterviews />
          </section>
        </div>

        {/* Activity Feed */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Recent Activity
          </h2>
          <ActivityFeed />
        </section>
      </div>
    </DashboardLayout>
  );
}

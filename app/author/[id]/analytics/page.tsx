import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AuthorService } from '@/services/author';
import AnalyticsSummary from '@/components/author/analytics/AnalyticsSummary';
import ListeningTrends from '@/components/author/analytics/ListeningTrends';
import PopularWorks from '@/components/author/analytics/PopularWorks';
import AudienceInsights from '@/components/author/analytics/AudienceInsights';
import DateRangePicker from '@/components/author/analytics/DateRangePicker';

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Author Insights',
  description:
    'View detailed analytics and insights about your content performance'
};

export default async function AnalyticsDashboard({
  params
}: {
  params: { id: string };
}) {
  const authorData = await AuthorService.getAuthorAnalytics(params.id);

  if (!authorData) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Track your content performance and audience engagement
            </p>
          </div>
          <DateRangePicker />
        </header>

        {/* Analytics Summary Cards */}
        <AnalyticsSummary author={authorData} />

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Listening Trends Chart */}
          <ListeningTrends />

          {/* Popular Works */}
          <PopularWorks works={authorData.works} />
        </div>

        {/* Audience Insights */}
        <AudienceInsights />
      </div>
    </main>
  );
}

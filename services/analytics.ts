import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalyticsReport,
  AnalyticsQuery,
  OutreachMetrics,
  MethodMetrics,
  MetricDataPoint,
  ContactStatus
} from '@/types/analytics';

// Define types for our database records
interface ContactRecord {
  status: ContactStatus;
  method: string;
  created_at: string;
  response_date: string | null;
}

// Type for our base query
type BaseQuery = ReturnType<ReturnType<SupabaseClient['from']>['select']>;

/**
 * Service for generating podcast outreach analytics and insights
 */
export class AnalyticsService {
  /**
   * Generate a complete analytics report
   */
  static async generateReport(query: AnalyticsQuery): Promise<AnalyticsReport> {
    const supabase = createClient();

    // Calculate date range
    const { startDate, endDate } = this.calculateDateRange(query.period);

    // Base query for the time period
    const baseQuery = supabase
      .from('contact_history')
      .select('*')
      .eq('author_id', query.authorId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Gather all required data
    const [metrics, methodMetrics, trends] = await Promise.all([
      this.calculateMetrics(baseQuery),
      query.includeMethodBreakdown
        ? this.calculateMethodMetrics(baseQuery)
        : [],
      query.includeTrends ? this.calculateTrends(baseQuery) : []
    ]);

    return {
      period: query.period,
      startDate,
      endDate,
      metrics,
      byMethod: methodMetrics,
      byStatus: await this.calculateStatusBreakdown(baseQuery),
      trends,
      topPodcastTypes: await this.calculateTopPodcastTypes(baseQuery),
      bestTimeToContact: await this.calculateBestContactTimes(baseQuery)
    };
  }

  /**
   * Calculate basic outreach metrics
   */
  private static async calculateMetrics(
    baseQuery: BaseQuery
  ): Promise<OutreachMetrics> {
    const { data, error } = await baseQuery;

    if (error) throw new Error(`Failed to calculate metrics: ${error.message}`);
    if (!data) return this.getEmptyMetrics();

    const records = data as ContactRecord[];
    const total = records.length;
    const responses = records.filter(
      (d) => d.status !== 'sent' && d.status !== 'noResponse'
    );
    const bookings = records.filter((d) => d.status === 'scheduled');
    const rejections = records.filter((d) => d.status === 'declined');

    // Calculate response times
    const responseTimes = responses.map((r) => {
      if (!r.response_date) return 0;
      const sent = new Date(r.created_at);
      const responded = new Date(r.response_date);
      return (responded.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24);
    });

    return {
      totalOutreach: total,
      responseRate: total ? (responses.length / total) * 100 : 0,
      bookingRate: total ? (bookings.length / total) * 100 : 0,
      averageResponseTime: responseTimes.length
        ? responseTimes.reduce((sum: number, days: number) => sum + days, 0) /
          responseTimes.length
        : 0,
      rejectionRate: total ? (rejections.length / total) * 100 : 0
    };
  }

  /**
   * Calculate metrics broken down by contact method
   */
  private static async calculateMethodMetrics(
    baseQuery: BaseQuery
  ): Promise<MethodMetrics[]> {
    const { data, error } = await baseQuery;

    if (error)
      throw new Error(`Failed to calculate method metrics: ${error.message}`);
    if (!data) return [];

    const records = data as ContactRecord[];
    const methodStats = new Map<string, MethodMetrics>();

    records.forEach((contact) => {
      const stats = methodStats.get(contact.method) || {
        method: contact.method,
        attempts: 0,
        responses: 0,
        bookings: 0,
        successRate: 0
      };

      stats.attempts++;
      if (contact.status === 'received') stats.responses++;
      if (contact.status === 'scheduled') stats.bookings++;

      methodStats.set(contact.method, stats);
    });

    return Array.from(methodStats.values()).map((stats) => ({
      ...stats,
      successRate: (stats.bookings / stats.attempts) * 100
    }));
  }

  /**
   * Generate time-series data for trend analysis
   */
  private static async calculateTrends(
    baseQuery: BaseQuery
  ): Promise<MetricDataPoint[]> {
    const { data, error } = await baseQuery;

    if (error) throw new Error(`Failed to calculate trends: ${error.message}`);
    if (!data) return [];

    const records = data as ContactRecord[];
    const dailyMetrics = new Map<string, number>();

    records.forEach((contact) => {
      const date = new Date(contact.created_at).toISOString().split('T')[0];
      dailyMetrics.set(date, (dailyMetrics.get(date) || 0) + 1);
    });

    return Array.from(dailyMetrics.entries()).map(([date, value]) => ({
      date: new Date(date),
      metric: 'outreach_attempts',
      value
    }));
  }

  /**
   * Calculate status breakdown
   */
  private static async calculateStatusBreakdown(
    baseQuery: BaseQuery
  ): Promise<Record<string, number>> {
    const { data, error } = await baseQuery;

    if (error)
      throw new Error(`Failed to calculate status breakdown: ${error.message}`);
    if (!data) return {};

    const records = data as ContactRecord[];
    return records.reduce((acc: Record<string, number>, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Calculate top performing podcast types
   */
  private static async calculateTopPodcastTypes(baseQuery: BaseQuery) {
    // Implementation will be added when podcast type data is available
    return [];
  }

  /**
   * Calculate best contact times
   */
  private static async calculateBestContactTimes(baseQuery: BaseQuery) {
    // Implementation will be added when we have more time-based data
    return {
      dayOfWeek: 2, // Tuesday
      timeOfDay: '10:00',
      successRate: 0
    };
  }

  /**
   * Helper function to calculate date range based on period
   */
  private static calculateDateRange(period: string): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setFullYear(2000); // All time
    }

    return { startDate, endDate };
  }

  /**
   * Helper function to get empty metrics
   */
  private static getEmptyMetrics(): OutreachMetrics {
    return {
      totalOutreach: 0,
      responseRate: 0,
      bookingRate: 0,
      averageResponseTime: 0,
      rejectionRate: 0
    };
  }
}

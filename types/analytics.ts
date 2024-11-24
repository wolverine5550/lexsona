/**
 * Types for podcast outreach analytics and reporting
 */

/**
 * Time periods for aggregating metrics
 */
export type AnalyticsPeriod =
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'all';

/**
 * Basic metrics for outreach effectiveness
 */
export interface OutreachMetrics {
  totalOutreach: number; // Total contact attempts
  responseRate: number; // Percentage that received responses
  bookingRate: number; // Percentage that led to bookings
  averageResponseTime: number; // Average days to response
  rejectionRate: number; // Percentage that were rejected
}

/**
 * Metrics broken down by contact method
 */
export interface MethodMetrics {
  method: string;
  attempts: number;
  responses: number;
  bookings: number;
  successRate: number;
}

/**
 * Time-series data point for trend analysis
 */
export interface MetricDataPoint {
  date: Date;
  metric: string;
  value: number;
}

/**
 * Complete analytics report
 */
export interface AnalyticsReport {
  period: AnalyticsPeriod;
  startDate: Date;
  endDate: Date;

  // Overall metrics
  metrics: OutreachMetrics;

  // Breakdowns
  byMethod: MethodMetrics[];
  byStatus: Record<string, number>;

  // Trends
  trends: MetricDataPoint[];

  // Top performing
  topPodcastTypes: Array<{
    category: string;
    successRate: number;
    count: number;
  }>;

  // Time analysis
  bestTimeToContact: {
    dayOfWeek: number;
    timeOfDay: string;
    successRate: number;
  };
}

/**
 * Parameters for querying analytics
 */
export interface AnalyticsQuery {
  authorId: string;
  period: AnalyticsPeriod;
  startDate?: Date;
  endDate?: Date;
  includeMethodBreakdown?: boolean;
  includeTrends?: boolean;
}

/**
 * Status of a contact attempt
 */
export type ContactStatus =
  | 'sent'
  | 'received'
  | 'noResponse'
  | 'scheduled'
  | 'declined';

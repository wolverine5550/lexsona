/**
 * Represents a single match success data point
 */
export interface MatchSuccessData {
  /** Unique identifier for the data point */
  id: string;
  /** The date when this data was recorded */
  date: string;
  /** Total number of match attempts made */
  totalAttempts: number;
  /** Number of successful matches */
  successfulMatches: number;
  /** Success rate calculated as (successfulMatches / totalAttempts) */
  successRate: number;
  /** Optional metadata for filtering */
  metadata?: {
    /** Mentor's industry or field */
    mentorField?: string;
    /** Mentee's desired field */
    menteeField?: string;
    /** Experience level of mentor */
    mentorExperience?: string;
    /** Career stage of mentee */
    menteeCareerStage?: string;
  };
}

/**
 * Filter options for match success data
 */
export interface MatchSuccessFilters {
  /** Start date for the date range filter */
  startDate?: string;
  /** End date for the date range filter */
  endDate?: string;
  /** Filter by mentor's field */
  mentorField?: string;
  /** Filter by mentee's desired field */
  menteeField?: string;
  /** Filter by mentor's experience level */
  mentorExperience?: string;
  /** Filter by mentee's career stage */
  menteeCareerStage?: string;
}

/**
 * Props for the MatchSuccessRate component
 */
export interface MatchSuccessRateProps {
  /** Initial data to display */
  initialData: MatchSuccessData[];
  /** Optional callback when filters change */
  onFilterChange?: (filters: MatchSuccessFilters) => void;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error message to display if data fetch fails */
  error?: string;
}

/**
 * Interview format type
 */
export type InterviewFormat =
  | 'technical'
  | 'behavioral'
  | 'cultural_fit'
  | 'general';

/**
 * Represents an interview data point
 */
export interface InterviewData {
  /** Unique identifier for the interview */
  id: string;
  /** When the interview was scheduled */
  scheduledAt: string;
  /** When the interview actually started */
  startedAt?: string;
  /** When the interview ended */
  endedAt?: string;
  /** Duration in minutes */
  duration?: number;
  /** Interview status */
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  /** Feedback scores */
  feedback?: {
    /** Overall satisfaction score (1-5) */
    satisfaction: number;
    /** Technical assessment score (1-5) */
    technical: number;
    /** Communication score (1-5) */
    communication: number;
    /** Cultural fit score (1-5) */
    culturalFit: number;
    /** Additional comments */
    comments?: string;
  };
  /** Interview metadata */
  metadata?: {
    /** Interview type/format */
    format: InterviewFormat;
    /** Interviewer's role */
    interviewerRole: string;
    /** Candidate's experience level */
    candidateLevel: string;
    /** Position being interviewed for */
    position: string;
  };
}

/**
 * Filter options for interview analytics
 */
export interface InterviewFilters {
  /** Start date for the date range filter */
  startDate?: string;
  /** End date for the date range filter */
  endDate?: string;
  /** Filter by interview status */
  status?: InterviewData['status'];
  /** Filter by interview format */
  format?: InterviewFormat;
  /** Filter by interviewer role */
  interviewerRole?: string;
  /** Filter by candidate level */
  candidateLevel?: string;
  /** Filter by position */
  position?: string;
}

/**
 * Props for the InterviewAnalytics component
 */
export interface InterviewAnalyticsProps {
  /** Initial data to display */
  initialData: InterviewData[];
  /** Optional callback when filters change */
  onFilterChange?: (filters: InterviewFilters) => void;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error message to display if data fetch fails */
  error?: string;
}

/**
 * User activity type for engagement tracking
 */
export type ActivityType =
  | 'login'
  | 'profile_view'
  | 'message_sent'
  | 'message_read'
  | 'resource_access'
  | 'feedback_given'
  | 'meeting_scheduled'
  | 'meeting_attended';

/**
 * User role type
 */
export type UserRole = 'mentor' | 'mentee' | 'admin';

/**
 * Represents a single engagement data point
 */
export interface EngagementData {
  /** Unique identifier for the activity */
  id: string;
  /** When the activity occurred */
  timestamp: string;
  /** Type of activity */
  activityType: ActivityType;
  /** User who performed the activity */
  userId: string;
  /** User's role */
  userRole: UserRole;
  /** Duration of the activity in seconds (if applicable) */
  duration?: number;
  /** Additional activity metadata */
  metadata?: {
    /** Platform section where activity occurred */
    section?: string;
    /** Feature being used */
    feature?: string;
    /** Target user (for interactions) */
    targetUserId?: string;
    /** Resource identifier (if applicable) */
    resourceId?: string;
    /** Custom properties */
    properties?: Record<string, unknown>;
  };
}

/**
 * Filter options for engagement metrics
 */
export interface EngagementFilters {
  /** Start date for the date range filter */
  startDate?: string;
  /** End date for the date range filter */
  endDate?: string;
  /** Filter by activity type */
  activityType?: ActivityType;
  /** Filter by user role */
  userRole?: UserRole;
  /** Filter by platform section */
  section?: string;
  /** Filter by feature */
  feature?: string;
}

/**
 * Props for the EngagementMetrics component
 */
export interface EngagementMetricsProps {
  /** Initial data to display */
  initialData: EngagementData[];
  /** Optional callback when filters change */
  onFilterChange?: (filters: EngagementFilters) => void;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error message to display if data fetch fails */
  error?: string;
}

/**
 * Performance metric categories
 */
export type PerformanceMetricCategory =
  | 'response_time'
  | 'completion_rate'
  | 'satisfaction_score'
  | 'attendance_rate'
  | 'feedback_score'
  | 'engagement_score';

/**
 * Time period for performance metrics
 */
export type TimePeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

/**
 * Performance metric data point
 */
export interface PerformanceMetric {
  /** Unique identifier for the metric */
  id: string;
  /** When the metric was recorded */
  timestamp: string;
  /** Category of the metric */
  category: PerformanceMetricCategory;
  /** Numerical value of the metric */
  value: number;
  /** Target value for this metric (if applicable) */
  target?: number;
  /** User associated with this metric */
  userId?: string;
  /** Role of the user */
  userRole?: UserRole;
  /** Additional metadata */
  metadata?: {
    /** Context or source of the metric */
    source?: string;
    /** Any relevant tags */
    tags?: string[];
    /** Notes or comments */
    notes?: string;
  };
}

/**
 * Filter options for performance metrics
 */
export interface PerformanceFilters {
  /** Start date for the date range filter */
  startDate?: string;
  /** End date for the date range filter */
  endDate?: string;
  /** Filter by metric category */
  category?: PerformanceMetricCategory;
  /** Filter by user role */
  userRole?: UserRole;
  /** Time period for aggregation */
  timePeriod?: TimePeriod;
  /** Minimum target threshold */
  minTarget?: number;
  /** Maximum target threshold */
  maxTarget?: number;
}

/**
 * Props for the PerformanceReports component
 */
export interface PerformanceReportsProps {
  /** Initial data to display */
  initialData: PerformanceMetric[];
  /** Optional callback when filters change */
  onFilterChange?: (filters: PerformanceFilters) => void;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Error message to display if data fetch fails */
  error?: string;
}

/**
 * Supported export file formats
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** File format to export as */
  format: ExportFormat;
  /** Whether to include metadata in export */
  includeMetadata?: boolean;
  /** Whether to include filtered data only */
  filteredDataOnly?: boolean;
  /** Custom file name (optional) */
  fileName?: string;
  /** Additional export options */
  options?: {
    /** Whether to include headers in CSV/XLSX */
    includeHeaders?: boolean;
    /** Whether to include chart images in PDF */
    includeCharts?: boolean;
    /** Whether to include summary statistics */
    includeSummary?: boolean;
    /** Date format for timestamp fields */
    dateFormat?: string;
    /** Number format for numeric fields */
    numberFormat?: string;
  };
}

/**
 * Props for the ExportButton component
 */
export interface ExportButtonProps<T> {
  /** Data to be exported */
  data: T[];
  /** Current active filters */
  currentFilters?: Partial<Record<keyof T, unknown>>;
  /** Component-specific field mappings */
  fieldMappings: Record<string, string>;
  /** Default file name */
  defaultFileName: string;
  /** Optional callback before export starts */
  onExportStart?: () => void;
  /** Optional callback after export completes */
  onExportComplete?: () => void;
  /** Optional callback if export fails */
  onExportError?: (error: Error) => void;
  /** Button variant */
  variant?: 'slim' | 'flat';
  /** Additional button className */
  className?: string;
  /** Optional callback to export data */
  onExport?: (data: T[]) => void;
}

/**
 * Export service configuration
 */
export interface ExportServiceConfig {
  /** API endpoint for server-side exports */
  apiEndpoint?: string;
  /** Maximum number of records for client-side export */
  clientSideLimit?: number;
  /** Whether to use server-side export for large datasets */
  useServerSide?: boolean;
  /** Timeout for export operations (ms) */
  timeout?: number;
}

/**
 * Export result metadata
 */
export interface ExportResult {
  /** Generated file name */
  fileName: string;
  /** File format used */
  format: ExportFormat;
  /** Number of records exported */
  recordCount: number;
  /** Export timestamp */
  timestamp: string;
  /** File size in bytes */
  fileSize: number;
  /** Whether the export was filtered */
  wasFiltered: boolean;
  /** Export duration in ms */
  duration: number;
}

/**
 * Represents a match data point
 */
export interface MatchData {
  id: string;
  name: string;
  value: number;
}

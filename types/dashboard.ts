/**
 * Core dashboard data types
 */

// Stats displayed in the overview cards
export interface DashboardStats {
  totalMatches: number;
  pendingRequests: number;
  upcomingInterviews: number;
  profileViews: number;
  lastUpdated: Date;
}

// Podcast match data structure
export interface PodcastMatch {
  id: string;
  podcastId: string;
  podcastName: string;
  hostName: string;
  matchScore: number;
  matchReason: string[];
  date: Date;
  status: 'new' | 'viewed' | 'contacted' | 'declined';
}

// Interview scheduling data
export interface Interview {
  id: string;
  podcastId: string;
  podcastName: string;
  hostName: string;
  date: Date;
  time: string;
  duration: number; // in minutes
  status: 'scheduled' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
}

// Activity and notification types
export interface Activity {
  id: string;
  type: 'match' | 'message' | 'interview' | 'review' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Notification extends Activity {
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
  };
}

/**
 * State management types
 */
export interface DashboardState {
  stats: DashboardStats | null;
  recentMatches: PodcastMatch[];
  upcomingInterviews: Interview[];
  activities: Activity[];
  notifications: Notification[];
  isLoading: boolean;
  error: Error | null;
}

export type DashboardAction =
  | { type: 'SET_STATS'; payload: DashboardStats }
  | { type: 'SET_MATCHES'; payload: PodcastMatch[] }
  | { type: 'SET_INTERVIEWS'; payload: Interview[] }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | {
      type: 'UPDATE_MATCH_STATUS';
      payload: { id: string; status: PodcastMatch['status'] };
    };
